import axios, { AxiosResponse } from "axios";
import fs from "fs";
import path from "path";

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

function logDevelopmentMode(msg: string) {
    if (process.env.NODE_ENV != "development") return;

    const logFilePath = path.join(__dirname, "fuseki.debug.log");

    if (fs.existsSync(logFilePath)) {
        const stats = fs.statSync(logFilePath);
        const fileSizeInBytes = stats.size;
      
        if (fileSizeInBytes > 10*1024*1024) {
            const content = fs.readFileSync(logFilePath, "utf8");
            const lines = content.split("\n");
            const linesToRemove = Math.floor(lines.length / 2);
            const remainingLines = lines.slice(linesToRemove);
            fs.writeFileSync(logFilePath, remainingLines.join("\n"), "utf8");
        }
    }

    const timestamp = new Date().toISOString();
    const logEntry = `<=== ${timestamp} ===>\n${msg}\n`;

    fs.appendFile(logFilePath, logEntry, (err) => {
        if (err) {
            console.error("Error writing to log file:", err);
        }
    });
}

let fusekiQueryPrefix: string | undefined = undefined;
const PREDEDINED_PREFIXES = {
    fuseki: "http://jena.apache.org/fuseki#",
    rdf: "http://www.w3.org/1999/02/22-rdf-syntax-ns#",
    rdfs: "http://www.w3.org/2000/01/rdf-schema#",
    xsd: "http://www.w3.org/2001/XMLSchema#",
    owl: "http://www.w3.org/2002/07/owl#",
    "": "http://qlgp#",
    inferred: "http://qlgp/inferred#",
    quanHeTrucTiep: "http://qlgp/quanHeTrucTiep#"
} as const satisfies Record<string, string>;

const allPrefixes: Record<string, string> = { ...PREDEDINED_PREFIXES };

function registerPrefix(prefix: string, url: string) {
    allPrefixes[prefix] = url;
    fusekiQueryPrefix = undefined;
}

function execQuery<TFields extends string>(query: string, method: "get"): Promise<FusekiGetResponse<TFields>>;
function execQuery(query: string, method: "post"): Promise<any>;
async function execQuery<TFields extends string = any>(query: string, method: "post" | "get") {
    console.log(`======================================================================${query}`);
    const fusekiUrl = process.env.QLGP_FUSEKI_URL || "http://localhost:3030";

    if (!fusekiQueryPrefix) {
        fusekiQueryPrefix = Object.entries(allPrefixes).map(([prefix, url]) => {
            return `PREFIX ${prefix}: <${url}>`
        }).join("\n");
    }

    query = `${fusekiQueryPrefix}\n${query}`;

    var response: AxiosResponse;
    try {
        if (method == "get") {
            response = await axios.get(`${fusekiUrl}/dataset`, {
                headers: {
                    "Content-Type": "application/x-www-form-urlencoded",
                    Accept: "application/sparql-results+json"
                },
                params: new URLSearchParams({ query: query })
            });
        }
        else {
            response = await axios.post(`${fusekiUrl}/dataset`, query, {
                headers: {
                    "Content-Type": "application/sparql-update",
                    Accept: "application/sparql-results+json",
                },
            });
        }
    } catch (e) {
        logDevelopmentMode(`${method.toUpperCase()}\n${query}\n=> Error: ${e}`);
        throw e;
    }

    const data = response.data;

    logDevelopmentMode(`${method.toUpperCase()}\n${query}${data ? `\n=> ${
        typeof data == "string" ? data : JSON.stringify(data, null, 4)    
    }` : ""}`);

    if (method == "get") {
        return data as FusekiGetResponse<TFields>;
    }
    return data;
}

async function execSelectQuery<TFields extends string>(query: string) {
    return await execQuery<TFields>(query, "get");
}

async function execPostQuery(query: string) {
    return await execQuery(query, "post");
}

const Fuseki = {
    PREDEDINED_PREFIXES,
    registerPrefix,
    execSelectQuery,
    execPostQuery
};

export default Fuseki;
