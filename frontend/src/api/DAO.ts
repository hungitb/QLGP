import type { IDAO } from "../../../general/model/IDAO";
import type { User } from "../../../general/model/User";
import type { Person } from "../../../general/model/Person";
import type { FieldDef } from "../../../general/model/FieldDef";
import type { FieldVal } from "../../../general/model/FieldVal";

const GENERATE_FAKE_DATA = process.env.NODE_ENV == "development" && false;

function createDAO(
  key: string,
  pkName: string,
  initialRows: { [key: string]: any }[] = []
) {
  let rows: { [key: string]: any }[] = GENERATE_FAKE_DATA
    ? initialRows
    : loadFromLocalStorage();

  function loadFromLocalStorage() {
    return JSON.parse(localStorage.getItem(key) || "[]");
  }

  function save() {
    if (GENERATE_FAKE_DATA) return;
    localStorage.setItem(key, JSON.stringify(rows));
  }

  function makeCopy(x: any): any {
    if (!x) return x;
    if (Array.isArray(x)) {
      return x.map((e) => makeCopy(e));
    }
    if (typeof x == "object") {
      const result: { [key: string]: any } = {};
      for (const key in x) {
        result[key] = makeCopy(x[key]);
      }
      return result;
    }
    return x;
  }

  const findByPk = (pk: string) => {
    return Promise.resolve(makeCopy(rows.find((row) => row[pkName] == pk)));
  };

  const findOne = ({ where }: { where: Record<string, any> }) => {
    return Promise.resolve(
      makeCopy(
        rows.find((row) => Object.entries(where).every(([k, v]) => row[k] == v))
      )
    );
  };

  const findAll = ({ where }: { where: Record<string, any> }) => {
    return Promise.resolve(
      makeCopy(
        rows.filter((row) =>
          Object.entries(where).every(([k, v]) => row[k] == v)
        )
      )
    );
  };

  const count = ({ where }: { where: Record<string, any> }) => {
    return Promise.resolve(
      rows.filter((row) => Object.entries(where).every(([k, v]) => row[k] == v))
        .length
    );
  };

  const create = (obj: Record<string, any>) => {
    rows.push(obj);
    save();
    return Promise.resolve();
  };

  const destroy = ({ where }: { where: Record<string, any> }) => {
    const toDeleteIndices = new Set();
    rows.forEach((row, index) => {
      if (Object.entries(where).every(([k, v]) => row[k] == v)) {
        toDeleteIndices.add(index);
      }
    });

    rows = rows.filter((row, index) => !toDeleteIndices.has(index));
    save();
    return Promise.resolve();
  };

  const update = (
    data: Record<string, any>,
    { where }: { where: Record<string, any> }
  ) => {
    rows.forEach((row) => {
      if (Object.entries(where).every(([k, v]) => row[k] == v)) {
        Object.entries(data).forEach(([k, v]) => {
          row[k] = v;
        });
      }
    });
    save();
    return Promise.resolve();
  };

  return {
    findByPk,
    findOne,
    findAll,
    count,
    create,
    destroy,
    update,
    refesh() {
      rows = loadFromLocalStorage();
    },
  };
}

export const userDAO: IDAO<User> = createDAO(
  "QLGP.users",
  "userId"
) as unknown as IDAO<User>;
export const personDAO: IDAO<Person> = createDAO(
  "QLGP.people",
  "id"
) as unknown as IDAO<Person>;
export const fieldDefDAO: IDAO<FieldDef> = createDAO(
  "QLGP.fieldDefs",
  "id"
) as unknown as IDAO<FieldDef>;
export const fieldValDAO: IDAO<FieldVal> = createDAO(
  "QLGP.fieldVals",
  "id"
) as unknown as IDAO<FieldVal>;
