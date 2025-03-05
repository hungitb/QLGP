import axios from "axios";
import { IDAO } from "../model/IDAO";
import { Person } from "../model/Person";

type Relationship = "father" | "mother" | "spouse";
const xungHo = [
    "bo", "me", "vochong", "ongNoi", "baNoi", "ongNgoai", "baNgoai"
] as const;
const xungHoMapping: Record<(typeof xungHo)[number], string> = {
    bo: "Bố",
    me: "Mẹ",
    vochong: "Vợ/Chồng",
    ongNoi: "Ông nội",
    baNoi: "Bà nội",
    ongNgoai: "Ông ngoại",
    baNgoai: "Bà ngoại"
};

let initDone = false;
async function initFuseki(personDAO: IDAO<Person>) {
    if (initDone) {
        return true;
    }

    const types = [
        "father", "mother", "spouse"
    ];

    const query = `
        INSERT DATA {
            :Person a owl:Class .

            ${[...types, ...xungHo].map(type => `
                :${type} a owl:ObjectProperty ;
                rdfs:domain :Person ;
                rdfs:range :Person .
            `).join("\n\n")}
        }
    `;
    await execSparQLQuery(query, "post");

    const batchSize = 100;
    const people = await personDAO.findAll();

    for (let i = 0; i < Math.ceil(people.length/batchSize); i++) {
        const batch: Person[] = [];
        for (let j = batchSize*i; j < batchSize*(i + 1) && j < people.length; j++) {
            batch.push(people[j]);
        }

        await Promise.all(batch.map(async person => {
            addPerson(person);
        }));
    }

    const relationships: [id1: string, id2: string, type: Relationship][] = [];
    for (const person of people) {
        if (person.fatherId) {
            relationships.push([person.id, person.fatherId, "father"]);
        }
        if (person.motherId) {
            relationships.push([person.id, person.motherId, "mother"]);
        }
        if (person.spouseId) {
            relationships.push([person.id, person.spouseId, "spouse"]);
        }
    }
    await Promise.all(relationships.map(relationship => addRelationship(...relationship)));

    initDone = true;
}

async function execSparQLQuery(query: string, method: "post" | "get" = "get") {
    const fusekiUrl = process.env.QLGP_FUSEKI_URL;

    query = `
        PREFIX fuseki: <http://jena.apache.org/fuseki#>
        PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>
        PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>
        PREFIX xsd: <http://www.w3.org/2001/XMLSchema#>
        PREFIX owl: <http://www.w3.org/2002/07/owl#>
        PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>
        PREFIX : <http://qlgp#>

        ${query}
    `;

    if (method == "get") {
        const response = await axios.get(`${fusekiUrl}/dataset`, {
            headers: {
                "Content-Type": "application/x-www-form-urlencoded",
                Accept: "application/sparql-results+json"
            },
            params: new URLSearchParams({ query: query })
        });

        return response.data;
    }

    const response = await axios.post(`${fusekiUrl}/dataset`, query, {
        headers: {
            "Content-Type": "application/sparql-update",
            Accept: "application/sparql-results+json",
        },
    });

    return response.data;
}

async function addPerson(person: { id: string }) {
    await execSparQLQuery(`
        INSERT DATA {
            :${person.id} a :Person
        }
    `, "post");
}

async function addRelationship(id1: string, id2: string, type: Relationship) {
    await execSparQLQuery(`
        INSERT DATA {
            :${id1} :${type} :${id2}
        }
    `, "post");
}

export default function getFusekiApi(personDAO: IDAO<Person>) {
    initFuseki(personDAO);

    const waitFuseki = () => new Promise<void>((resolve, reject) => {
        let count = 0;

        function check() {
            if (initDone) resolve();

            if (count < 10000) {
                count++;
                setTimeout(check, 10);
            }

            else {
                reject("Timeout to wait fuseki available!");
            }
        }
        
        check();
    });

    return {
        async addPerson(person: { id: string }) {
            await waitFuseki();
            await addPerson(person);
        },
        async deletePerson(id: string) {
            await waitFuseki();

            await Promise.all([
                execSparQLQuery(`
                    DELETE WHERE {
                        :${id} ?p ?o
                    }
                `, "post"),
                execSparQLQuery(`
                    DELETE WHERE {
                        ?s ?p :${id}
                    }
                `, "post")
            ]);
        },
        async addRelationship(id1: string, id2: string, type: Relationship) {
            await waitFuseki();
            await addRelationship(id1, id2, type);
        },
        async deleteRelationship(id1: string | null, id2: string | null, type: Relationship | null) {
            await waitFuseki();

            const s = id1 ? `:${id1}` : "?s";
            const p = type ? `:${type}` : "?p";
            const o = id2 ? `:${id2}` : "?o";

            await execSparQLQuery(`
                DELETE WHERE {
                    ${s} ${p} ${o} .
                }
            `, "post");
        },
        async inferenceRelationship(id1: string, id2: string): Promise<string> {
            await waitFuseki();

            const data = await execSparQLQuery(`
                SELECT ?p WHERE {
                    :${id1} ?p :${id2}
                } 
            `);

            const pValues = data.results.bindings.map((obj: any) => obj.p.value.replace("http://qlgp#", ""));

            const xungHo = pValues.find((pv: any) => (pv in xungHoMapping));
            
            return xungHo ? xungHoMapping[xungHo as keyof typeof xungHoMapping] : "Không rõ";
        }
    };
}
