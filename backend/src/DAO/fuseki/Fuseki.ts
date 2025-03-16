import axios from "axios";

const PREFIX = "http://qlgp#";

type FusekiGetResponse<TFields extends string> = {
    results: {
        bindings: {
            [field in TFields]: {
                type: "uri" | "literal";
                value: string;
                datatype?: string;
            }
        }[]
    }
};

function execQuery<TFields extends string>(query: string, method: "get"): Promise<FusekiGetResponse<TFields>>;
function execQuery(query: string, method: "post"): Promise<any>;

async function execQuery<TFields extends string = any>(query: string, method: "post" | "get") {
    const fusekiUrl = process.env.QLGP_FUSEKI_URL || "localhost:3030";

    query = `
        PREFIX fuseki: <http://jena.apache.org/fuseki#>
        PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>
        PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>
        PREFIX xsd: <http://www.w3.org/2001/XMLSchema#>
        PREFIX owl: <http://www.w3.org/2002/07/owl#>
        PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>
        PREFIX : <${PREFIX}>

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

        return response.data as FusekiGetResponse<TFields>;
    }

    const response = await axios.post(`${fusekiUrl}/dataset`, query, {
        headers: {
            "Content-Type": "application/sparql-update",
            Accept: "application/sparql-results+json",
        },
    });

    return response.data;
}

async function execSelectQuery<TFields extends string>(query: string) {
    console.log("=====================================================================\n", query);
    return await execQuery<TFields>(query, "get");
}

async function execPostQuery(query: string) {
    console.log("=====================================================================\n", query);
    return await execQuery(query, "post");
}

const Fuseki = {
    PREFIX,
    execSelectQuery,
    execPostQuery
};

export default Fuseki;
