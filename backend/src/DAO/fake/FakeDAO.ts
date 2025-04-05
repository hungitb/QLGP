import type { IDAO, IDASO } from "../../model/IDAO";
import type { User } from "../../model/User";
import type { Person } from "../../model/Person";
import { Gender, LifeStatus } from "../../model/Person";
import type { FieldDef } from "../../model/FieldDef";
import type { FieldVal } from "../../model/FieldVal";
import { DEFAUT_ADMIN_PASSWORD, DEFAUT_ADMIN_USERNAME } from "../../controller/auth";
import { defaultThongTinGiaPhaValue, ThongTinGiaPha } from "../../model/ThongTinGiaPha";

const isWeb = typeof window != "undefined" && typeof document != "undefined";

const GENERATE_FAKE_DATA =
  process.env.NODE_ENV == "development" &&
  isWeb
    ? process.env.QLGP_FRONTEND_GEN_FAKE_DATA == "true"
    : process.env.QLGP_BACKEND_FAKE_DB == "true";
const DELAY = 100;

type Dict = { [key: string]: any };
type AllTableTypes = [User[], Person[], FieldDef[], FieldVal[], ThongTinGiaPha[]];
const tableNames = [
  "users",
  "people",
  "fieldDefs",
  "fieldVals",
  "ThongTinGiaPha"
] as const;
const x: (typeof tableNames)["length"] extends AllTableTypes["length"] ? number : never = 1; // Trick
type Storage = {
  startOperations: () => Promise<void>;
  endOperations: () => Promise<void>;
  getItem: (key: string) => Promise<Dict[]>;
  setItem: (key: string, value: Dict[]) => Promise<void>;
};

const storage: Storage = (() => {
  const { getItem: _getItem, setItem: _setItem } = (() => {
    // Không phải trên web nên không thực hiện gì cả
    if (!isWeb) {
      return {
        getItem(key: string) {
          return Promise.resolve([] as Dict[]);
        },
        setItem(key: string, value: Dict[]) {
          return Promise.resolve();
        }
      }
    }

    const getItemLocalStorage = (key: string) =>
      JSON.parse(localStorage.getItem(key) || "[]");
    const setItemLocalStorage = (key: string, value: Dict[]) =>
      localStorage.setItem(key, JSON.stringify(value));

    if ((!isWeb) || (!window.indexedDB)) {
      return {
        getItem: (key: string) =>
          Promise.resolve(getItemLocalStorage(key) as Dict[]),
        setItem: (key: string, value: Dict[]) =>
          Promise.resolve(setItemLocalStorage(key, value)),
      };
    }

    const dbName = "QLGP";
    const storeName = "KeyValueStore";

    function openDB() {
      return new Promise((resolve, reject) => {
        const request = indexedDB.open(dbName, 1);

        request.onupgradeneeded = (event) => {
          const db = (event.target as any).result;
          if (!db.objectStoreNames.contains(storeName)) {
            db.createObjectStore(storeName, { keyPath: "key" });
          }
        };

        request.onsuccess = (event) => resolve((event.target as any).result);
        request.onerror = (event) => reject((event.target as any).error);
      });
    }

    function setItemIndexedDb(key: string, value: Dict[]) {
      return new Promise<void>((resolve, reject) => {
        openDB()
          .then((db) => {
            const transaction = (db as any).transaction(storeName, "readwrite");
            const store = transaction.objectStore(storeName);

            const request = store.put({ key, value });
            request.onsuccess = () => resolve();
            request.onerror = (event: any) => reject(event.target.error);
          })
          .catch((err) => reject(err));
      });
    }

    function getItemIndexedDb(key: string): Promise<Dict[]> {
      return new Promise((resolve, reject) => {
        openDB()
          .then((db) => {
            const transaction = (db as any).transaction(storeName, "readonly");
            const store = transaction.objectStore(storeName);

            const request = store.get(key);
            request.onsuccess = (event: any) =>
              resolve(event.target.result?.value || []);
            request.onerror = (event: any) => reject(event.target.error);
          })
          .catch((err) => reject(err));
      });
    }

    function setItem(key: string, value: Dict[]) {
      setItemLocalStorage(key, value);
      try {
        return setItemIndexedDb(key, value);
      } catch {
        return Promise.resolve();
      }
    }

    function getItem(key: string): Promise<Dict[]> {
      try {
        return getItemIndexedDb(key);
      } catch {
        return Promise.resolve(getItemLocalStorage(key));
      }
    }

    return { getItem, setItem };
  })();

  let isInOperationsChain = false;
  let tempValue: Record<string, Dict[]> = {};

  return {
    startOperations: async () => {
      isInOperationsChain = true;
    },
    endOperations: async () => {
      Object.entries(tempValue).forEach(([key, value]) => {
        _setItem(key, value);
      });
      tempValue = {};
      isInOperationsChain = false;
    },
    getItem: (key) => {
      if (isInOperationsChain && tempValue[key] !== undefined) {
        return Promise.resolve(tempValue[key]);
      }
      return _getItem(key);
    },
    setItem: (key, value) => {
      if (isInOperationsChain) {
        tempValue[key] = value;
        return Promise.resolve();
      }
      return _setItem(key, value);
    },
  };
})();

export function wrapApi<K extends { [f: string]: (...params: any[]) => any }>(
  api: K
): K {
  if (process.env.QLGP_USE_BACKEND == "true") {
    return api;
  }
  Object.entries(api).forEach(([name, f]) => {
    (api as any)[name] = (...params: any[]) => {
      storage.startOperations();
      const result = f(...params);
      if (result instanceof Promise) {
        return new Promise((resolve, reject) => {
          result
            .then((r) => resolve(r))
            .catch((err) => reject(err))
            .finally(() => storage.endOperations());
        });
      }
      storage.endOperations();
      return result;
    };
  });
  return api;
}

function createDAO(key: `QLGP.${(typeof tableNames)[number]}`, pkName: string, initialRows: Promise<Dict[]>) {
  let rows: Dict[] = [];

  let initDone = false;
  async function init() {
    if (initDone) return;
    rows = await initialRows;
    initDone = true;
    return;
  }

  async function save() {
    if (GENERATE_FAKE_DATA) return;
    await storage.setItem(key, rows);
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

  function createPromiseResolve(data?: any) {
    if (DELAY < 1 || process.env.NODE_ENV != "development") {
      return Promise.resolve(data);
    }

    return new Promise((resolve) => {
      setTimeout(() => resolve(data), DELAY);
    });
  }

  const findByPk = async (pk: string) => {
    await init();
    return await createPromiseResolve(
      makeCopy(rows.find((row) => row[pkName] == pk))
    );
  };

  const findOne = async ({ where }: { where: Record<string, any> }) => {
    await init();
    return await createPromiseResolve(
      makeCopy(
        rows.find((row) => Object.entries(where).every(([k, v]) => row[k] == v))
      )
    );
  };

  const findAll = async (param?: { where: Record<string, any> }) => {
    await init();
    if (!param) {
      return makeCopy(rows);
    }

    const { where } = param;

    return await createPromiseResolve(
      makeCopy(
        rows.filter((row) =>
          Object.entries(where).every(([k, v]) => row[k] == v)
        )
      )
    );
  };

  const count = async ({ where }: { where: Record<string, any> }) => {
    await init();
    return await createPromiseResolve(
      rows.filter((row) => Object.entries(where).every(([k, v]) => row[k] == v))
        .length
    );
  };

  const create = async (obj: Record<string, any>) => {
    await init();
    rows.push(obj);
    await save();
    return await createPromiseResolve();
  };

  const destroy = async ({ where }: { where: Record<string, any> }) => {
    await init();
    const toDeleteIndices = new Set();
    rows.forEach((row, index) => {
      if (Object.entries(where).every(([k, v]) => row[k] == v)) {
        toDeleteIndices.add(index);
      }
    });

    rows = rows.filter((row, index) => !toDeleteIndices.has(index));
    await save();
    return await createPromiseResolve();
  };

  const update = async (
    data: Record<string, any>,
    { where }: { where: Record<string, any> }
  ) => {
    await init();
    rows.forEach((row) => {
      if (Object.entries(where).every(([k, v]) => row[k] == v)) {
        Object.entries(data).forEach(([k, v]) => {
          row[k] = v;
        });
      }
    });
    await save();
    return await createPromiseResolve();
  };

  return {
    findByPk,
    findOne,
    findAll,
    count,
    create,
    destroy,
    update,
    async refesh() {
      rows = await storage.getItem(key);
    },
  };
}

function createDASO<X>(DAO: IDAO<X>, initValue: X): IDASO<X> {
  const specKey = "__inserted__";

  let initDone = false;
  let initing = false;
  const init = async () => {
    if (initDone) return;

    if (initing) {
      await new Promise<void>((resolve, reject) => {
        let count  = 0;

        const check = () => {
          if (initDone) resolve();

          count++;
          if (count < 100) {
            setTimeout(check, 100);
          } else {
            reject("Timeout");
          }
        }

        check();
      });
      return;
    }

    initing = true;

    const data = await DAO.findAll();
    if (data.length == 0) {
      await DAO.create({
        ...initValue,
        [specKey]: "true"
      });
    }

    initing = false;
    initDone = true;
  }

  async function get() {
    await init();
    const data = await DAO.findAll();
    if (data.length < 1) {
      throw Error("Can't get object, list empty");
    }
    return data[0];
  }

  return {
    get,
    async update(data: Partial<X>) {
      await init();
      await DAO.update(data, { where: { [specKey]: "true" } as any })
    }
  };
}

function getData(): Promise<Dict[]>[] {
  if (GENERATE_FAKE_DATA) {
    function generateFakeData(): AllTableTypes {
      const NUM_PEOPLE = 10;
      const MALE_RATE = 0.6;
      const DEATH_RATE = 0.4;
    
      const random = (() => {
        let s = 1;
        return () => {
          const x = Math.sin(s++) * 10000;
          return x - Math.floor(x);
        };
      })();
      const randInt = (a: number, b: number) => {
        return a + Math.floor(random() * (b - a + 1));
      };
      const randomId = (() => {
        const exitedIds = new Set();
    
        return () => {
          let id = randInt(1, 2e9);
          while (exitedIds.has(id)) id = randInt(1, 2e9);
          exitedIds.add(id);
          return id.toString();
        };
      })();
      function sampleOne<K>(arr: K[]): K {
        return arr[Math.floor(random() * arr.length)];
      }
      function sample<K>(arr: K[], n: number): K[] {
        if (n > arr.length) return arr;
    
        const indices = new Set<number>();
        for (let i = 0; i < n; i++) {
          let index = randInt(0, arr.length - 1);
          while (indices.has(index)) {
            index = randInt(0, arr.length - 1);
          }
          indices.add(index);
        }
        const result = [] as K[];
        for (const index of indices) result.push(arr[index]);
        return result;
      }
    
      const fakseUserId = randomId();
    
      const fakeUsers: User[] = [
        {
          id: fakseUserId,
          username: DEFAUT_ADMIN_USERNAME,
          password: DEFAUT_ADMIN_PASSWORD,
          sessionToken: null,
          sessionExpiry: null,
          permission: "admin",
          note: "",
        },
      ];
    
      const fakePeople: Person[] = [
        {
          id: randomId(),
          callname: "Tôi",
          gender: Gender.MALE,
          birthdate: "9/9/2003",
          status: LifeStatus.ALIVE,
          avatarUrl: null,
          deathdate: null,
          spouseId: null,
          fatherId: null,
          motherId: null,
        },
      ];
    
      // Sử dụng tháng này để làm phần sự kiện
      const currMonth = new Date().getMonth() + 1;
      const prevMonth = currMonth == 1 ? 12 : currMonth - 1;
      const nextMonth = currMonth == 12 ? 1 : currMonth + 1;
    
      for (let i = 0; i < NUM_PEOPLE; i++) {
        const day = randInt(1, 28);
        const month = sampleOne([prevMonth, currMonth, nextMonth]);
        const year = randInt(1800, 2100);
    
        const birthdate =
          random() > 0.1
            ? (random() < 0.3
                ? [year]
                : random() < 0.5
                ? [month, year]
                : [day, month, year]
              ).join("/")
            : null;
    
        const status =
          random() > 0.1
            ? random() < DEATH_RATE
              ? LifeStatus.DEAD
              : LifeStatus.ALIVE
            : null;
    
        const deathdate =
          status == LifeStatus.DEAD
            ? random() < 0.1
              ? null
              : random() < 0.3
              ? [year + randInt(1, 90)].join("/")
              : random() < 0.5
              ? [month, year + randInt(1, 90)].join("/")
              : [day, month, year + randInt(1, 90)].join("/") +
                (random() > 0.2 ? "AL" : "")
            : null;
    
        const gender = random() < MALE_RATE ? Gender.MALE : Gender.FEMALE;
    
        fakePeople.push({
          id: randomId(),
          callname: [
            sampleOne(["Nguyễn", "Lê", "Đinh", "Phạm"]),
            gender == Gender.MALE ? "Văn" : "Thị",
            sampleOne("ABCDEFGHIKLMNOPQRSTWZYJ".split("")),
          ].join(" "),
          gender,
          birthdate,
          deathdate,
          status,
          spouseId: null,
          fatherId: null,
          motherId: null,
          avatarUrl: null,
        });
    
        const personMapping: Record<string, Person> = {};
        fakePeople.forEach((person) => (personMapping[person.id] = person));
    
        for (let i = 0; i < Math.round(NUM_PEOPLE ** 2); i++) {
          const hasRelationship = (p1: Person, p2: Person) => {
            if (
              [p1.id, p1.spouseId, p1.fatherId, p1.motherId].some(
                (id) => id == p2.id
              ) ||
              [p2.id, p2.spouseId, p2.fatherId, p2.motherId].some(
                (id) => id == p1.id
              )
            ) {
              return false;
            }
            return false;
          };
          const [p1, p2] = sample(fakePeople, 2);
          if (hasRelationship(p1, p2)) continue;
    
          if (random() < 0.2) {
            // 1 người chỉ có 1 vợ 1 chồng, vậy nên nếu cập nhật đôi này thì phải cập nhật tất cả những người liên quan
            [p1, p2].forEach((p) => {
              const pSpouse = p.spouseId ? personMapping[p.spouseId] : null;
              if (pSpouse) pSpouse.spouseId = null;
            });
    
            p1.spouseId = p2.id;
            p2.spouseId = p1.id;
    
            continue;
          }
    
          if (p1.gender == Gender.MALE) {
            p2.fatherId = p1.id;
          } else {
            p2.motherId = p1.id;
          }
        }
      }
    
      return [
        fakeUsers,
        fakePeople,
        [] as FieldDef[],
        [] as FieldVal[],
        [] as ThongTinGiaPha[]
      ];
    }

    return generateFakeData().map((d) => Promise.resolve(d));
  }

  const dataVersion = 1;

  let _cache: Dict[][] | null = null;
  async function getDataFromStorage() {
    if (_cache) return _cache;

    const tableDatas = (await Promise.all(
      tableNames.map((name) => storage.getItem(`QLGP.${name}`))
    )) as AllTableTypes;

    const [users, people, fieldDefs, fieldVals] = tableDatas;
    await storage.setItem("QLGP.metadata", [{ dataVersion }]);

    _cache = [users, people, fieldDefs, fieldVals];
    return _cache;
  }
  getDataFromStorage();

  return tableNames.map(
    (_, idx) =>
      new Promise((resolve) =>
        getDataFromStorage().then((data) => resolve(data[idx]))
      )
  );
}

const [users, people, fieldDefs, fieldVals, ThongTinGiaPhas] = getData();

export const userDAO: IDAO<User> = createDAO(
  "QLGP.users",
  "id",
  users
) as unknown as IDAO<User>;
export const personDAO: IDAO<Person> = createDAO(
  "QLGP.people",
  "id",
  people
) as unknown as IDAO<Person>;
export const fieldDefDAO: IDAO<FieldDef> = createDAO(
  "QLGP.fieldDefs",
  "id",
  fieldDefs
) as unknown as IDAO<FieldDef>;
export const fieldValDAO: IDAO<FieldVal> = createDAO(
  "QLGP.fieldVals",
  "id",
  fieldVals
) as unknown as IDAO<FieldVal>;
const ttgpDAO: IDAO<ThongTinGiaPha> = createDAO(
  "QLGP.ThongTinGiaPha",
  "type",
  ThongTinGiaPhas
);
export const ttgpDASO = createDASO(ttgpDAO, defaultThongTinGiaPhaValue);

if (process.env.NODE_ENV == "development" && isWeb) {
  (window as any).userDAO = userDAO;
  (window as any).personDAO = personDAO;
  (window as any).fieldDefDAO = fieldDefDAO;
  (window as any).fieldValDAO = fieldValDAO;
}

export async function exportData() {
  const [users, people, fieldDefs, fieldVals, TTGP] =
    await Promise.all([
      userDAO.findAll(),
      personDAO.findAll(),
      fieldDefDAO.findAll(),
      fieldValDAO.findAll(),
      ttgpDAO.findAll()
    ]);

  return JSON.stringify({
    users,
    people,
    fieldDefs,
    fieldVals,
    TTGP
  });
}
