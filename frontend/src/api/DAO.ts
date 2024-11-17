import type { IDAO } from "../../../general/model/IDAO";
import type { User } from "../../../general/model/User";
import type { Person } from "../../../general/model/Person";
import { Gender, LifeStatus } from "../../../general/model/Person";
import type { FieldDef } from "../../../general/model/FieldDef";
import type { FieldVal } from "../../../general/model/FieldVal";

const GENERATE_FAKE_DATA =
  process.env.NODE_ENV == "development" &&
  process.env.GENERATE_FAKE_DATA == "true";

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

  function createPromiseResolve(data?: any) {
    const DELAY = 1000;

    if (DELAY < 1) {
      return Promise.resolve(data);
    }

    return new Promise((resolve) => {
      setTimeout(() => resolve(data), DELAY);
    });
  }

  const findByPk = (pk: string) => {
    return createPromiseResolve(
      makeCopy(rows.find((row) => row[pkName] == pk))
    );
  };

  const findOne = ({ where }: { where: Record<string, any> }) => {
    return createPromiseResolve(
      makeCopy(
        rows.find((row) => Object.entries(where).every(([k, v]) => row[k] == v))
      )
    );
  };

  const findAll = ({ where }: { where: Record<string, any> }) => {
    return createPromiseResolve(
      makeCopy(
        rows.filter((row) =>
          Object.entries(where).every(([k, v]) => row[k] == v)
        )
      )
    );
  };

  const count = ({ where }: { where: Record<string, any> }) => {
    return createPromiseResolve(
      rows.filter((row) => Object.entries(where).every(([k, v]) => row[k] == v))
        .length
    );
  };

  const create = (obj: Record<string, any>) => {
    rows.push(obj);
    save();
    return createPromiseResolve();
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
    return createPromiseResolve();
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
    return createPromiseResolve();
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

function generateFakeData() {
  if (!GENERATE_FAKE_DATA) return [];

  const NUM_PEOPLE = 100;
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
    const result = [];
    for (const index of indices) result.push(arr[index]);
    return result;
  }

  const fakseUserId = randomId();
  const fakeUsers: User[] = [
    {
      userId: fakseUserId,
      username: "hungnv195",
      password: "hungnv195",
      sessionToken: "hungnv195",
      sessionExpiry: null,
    },
  ];

  const fakePeople: Person[] = [
    {
      id: randomId(),
      ownerUserId: fakseUserId,
      isStandForUser: true,
      callname: "Tôi",
      gender: Gender.MALE,
      birthday: "9/9/2003",
      status: LifeStatus.ALIVE,
      avatarUrl: null,
      deathday: null,
      spouseId: null,
      fatherId: null,
      motherId: null,
    },
  ];

  for (let i = 0; i < NUM_PEOPLE; i++) {
    const day = randInt(1, 28);
    const month = randInt(1, 12);
    const year = randInt(1800, 2100);

    const birthday =
      random() < 0.1
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

    const deathday =
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

    fakePeople.push({
      id: randomId(),
      ownerUserId: fakseUserId,
      isStandForUser: false,
      callname: [
        sampleOne(["Nguyễn", "Lê", "Đinh", "Phạm"]),
        sampleOne(["Văn", "Thị"]),
        sampleOne("ABCDEFGHIKLMNOPQRSTWZYJ".split("")),
      ].join(" "),
      gender: random() < MALE_RATE ? Gender.MALE : Gender.FEMALE,
      birthday,
      deathday,
      status,
      spouseId: null,
      fatherId: null,
      motherId: null,
      avatarUrl: null,
    });

    const personMapping: Record<string, Person> = {};
    fakePeople.forEach((person) => (personMapping[person.id] = person));

    for (let i = 0; i < Math.round((NUM_PEOPLE * NUM_PEOPLE) / 8); i++) {
      const hasRelationship = (p1: Person, p2: Person) => {
        if (
          [p1.spouseId, p1.fatherId, p1.motherId].some((id) => id == p2.id) ||
          [p2.spouseId, p2.fatherId, p2.motherId].some((id) => id == p1.id)
        ) {
          return false;
        }
        return false;
      };
      const [p1, p2] = sample(fakePeople, 2);
      if (hasRelationship(p1, p2)) continue;

      if (p1.gender != p2.gender && random() < 0.4) {
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

  console.log(fakePeople, fakeUsers);

  return [fakeUsers, fakePeople];
}

const [fakeUsers, fakePeople, fakeFieldDefs, fakeFieldVals] =
  generateFakeData();

export const userDAO: IDAO<User> = createDAO(
  "QLGP.users",
  "userId",
  fakeUsers
) as unknown as IDAO<User>;
export const personDAO: IDAO<Person> = createDAO(
  "QLGP.people",
  "id",
  fakePeople
) as unknown as IDAO<Person>;
export const fieldDefDAO: IDAO<FieldDef> = createDAO(
  "QLGP.fieldDefs",
  "id",
  fakeFieldDefs
) as unknown as IDAO<FieldDef>;
export const fieldValDAO: IDAO<FieldVal> = createDAO(
  "QLGP.fieldVals",
  "id",
  fakeFieldVals
) as unknown as IDAO<FieldVal>;
