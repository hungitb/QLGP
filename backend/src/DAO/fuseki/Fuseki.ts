import axios from "axios";

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

let fusekiQueryPrefix: string | undefined = undefined;
const allPrefixes: Record<string, string> = {
    fuseki: "http://jena.apache.org/fuseki#",
    rdf: "http://www.w3.org/1999/02/22-rdf-syntax-ns#",
    rdfs: "http://www.w3.org/2000/01/rdf-schema#",
    xsd: "http://www.w3.org/2001/XMLSchema#",
    owl: "http://www.w3.org/2002/07/owl#",
    "": "http://qlgp#"
};

function registerPrefix(prefix: string, url: string) {
    allPrefixes[prefix] = url;
    fusekiQueryPrefix = undefined;
}

function execQuery<TFields extends string>(query: string, method: "get"): Promise<FusekiGetResponse<TFields>>;
function execQuery(query: string, method: "post"): Promise<any>;
async function execQuery<TFields extends string = any>(query: string, method: "post" | "get") {
    console.log("=====================================================================\n", query);
    const fusekiUrl = process.env.QLGP_FUSEKI_URL || "localhost:3030";

    if (!fusekiQueryPrefix) {
        fusekiQueryPrefix = Object.entries(allPrefixes).map(([prefix, url]) => {
            return `PREFIX ${prefix}: <${url}>`
        }).join("\n");
    }

    query = `${fusekiQueryPrefix}\n${query}`;

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
    return await execQuery<TFields>(query, "get");
}

async function execPostQuery(query: string) {
    return await execQuery(query, "post");
}

const Fuseki = {
    registerPrefix,
    execSelectQuery,
    execPostQuery
};

export default Fuseki;
