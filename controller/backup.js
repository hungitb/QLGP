// backup.js
const database = require('../config/database');

async function executeQuery(query, params) {
    return new Promise((resolve, reject) => {
        database.query(query, params, (error, results) => {
            if (error) {
                reject(error); // Trả về lỗi nếu có lỗi xảy ra
            } else {
                resolve(results); // Trả về kết quả nếu không có lỗi
            }
        });
    });
}

async function getAllBaseInfo(uId) {
    return new Promise((resolve, reject) => {
        if (!uId) {
            reject({ message: 'UNAUTHORIZED' });
        }
        const query = `
            SELECT id FROM person
            WHERE ownerUserId = "${uId}"
        `;
        database.query(query, function (error, result) {
            if (error) {
                reject({ message: error.message });
            } else {
                const info = [];
                const len = result.length;
                let count = 0;
                for (const pid of result) {
                    const id = pid.id;
                    const query1 = `SELECT * FROM person WHERE id = ${id}`;
                    database.query(query1, function (error, result) {
                        if (error) {
                            reject({ message: error.message });
                        } else {
                            const person = result[0];
                            const query2 = `SELECT fieldDefinitionCode,value FROM fieldvalue 
                                    WHERE personId = ? AND fieldDefinitionCode IN (?, ?, ?, ?, ?)`;
                            database.query(query2, [id, 'avatar', 'birthday', 'callname', 'deathday', 'gender'], function (error, result) {
                                if (error) {
                                    reject({ message: error.message });
                                } else {
                                    const fields = result.reduce((acc, field) => {
                                        acc[field.fieldDefinitionCode] = field.value;
                                        return acc;
                                    }, {});
                                    const query3 = `SELECT fieldDefinitionCode, value FROM fieldvalue 
                                            WHERE personId = ? AND fieldDefinitionCode IN (?, ?, ?)`;
                                    database.query(query3, [id, 'spouse', 'father', 'mother'], function (error, result) {
                                        if (error) {
                                            reject({ message: error.message });
                                        } else {
                                            const relatedPersons = {};
                                            var check = 0;
                                            for (const relation of result) {
                                                const relatedId = relation.value;
                                                const query4 = `SELECT value FROM fieldvalue 
                                                            WHERE personId = ? AND fieldDefinitionCode IN (?, ?)`
                                                database.query(query4, [relatedId, 'callname', 'avatar'], function (error, result) {
                                                    check++;
                                                    if (error) {
                                                        reject({ message: error.message });
                                                    } else {
                                                        if (result.length > 0) {
                                                            relatedPersons[relation.fieldDefinitionCode] = {
                                                                id: relatedId,
                                                                callname: result[0].value,
                                                                avatar: result[1].value
                                                            };
                                                        } else {
                                                            relatedPersons[relation.fieldDefinitionCode] = null;
                                                        }
                                                    }
                                                    if (check == 3) {
                                                        const ans = {
                                                            person: person,
                                                            fields: fields,
                                                            relatedPersons: relatedPersons
                                                        };
                                                        info.push(ans);
                                                        count++;
                                                        if (count === len) {
                                                            resolve(info);
                                                        }
                                                    }
                                                });
                                            }
                                        }
                                    });
                                }
                            });
                        }
                    });
                }
            }
        });
    });
}

async function insertPerson(person) {
    const { ownerUserId, searchString, isStandForUser } = person;
    const result = await executeQuery(
        `INSERT INTO Person (ownerUserId, searchString, isStandForUser) VALUES (?, ?, ?)`,
        [ownerUserId, searchString, isStandForUser]
    );
    return result.insertId;
}

async function insertFieldValue(personId, fieldDefinitionId, fieldDefinitionCode, value ) {
    await executeQuery(
        `INSERT INTO FieldValue (personId, fieldDefinitionId, fieldDefinitionCode, value) VALUES (?, ?, ?, ?)`,
        [personId, fieldDefinitionId, fieldDefinitionCode, value]
    );
}

async function personExists(ownerUserId, searchString) {
    const rows = await executeQuery(
        `SELECT * FROM Person WHERE ownerUserId = ? AND searchString = ?`,
        [ownerUserId, searchString]
    );
    return rows.length > 0 ? rows[0].id : null;
}

async function backupFamilyDataToCSV(userId) {
    try {
        const familyData = await getAllBaseInfo(userId);
        let csvData = 'PersonID,Callname,Avatar,Birthday,Deathday,Gender,isStandForUser,SpouseID,SpouseName,SpouseAvatar,FatherID,FatherName,FatherAvatar,MotherID,MotherName,MotherAvatar\n';
        familyData.forEach(entry => {
            const person = entry.person;
            const fields = entry.fields;
            const relatedPersons = entry.relatedPersons;
            csvData += `${person.id},"${fields.callname}","${fields.avatar}","${fields.birthday}","${fields.deathday}","${fields.gender}","${person.isStandForUser}",`;
            if (relatedPersons.spouse) {
                csvData += `${relatedPersons.spouse.id},"${relatedPersons.spouse.callname}","${relatedPersons.spouse.avatar}",`;
            } else {
                csvData += ',,,';
            }
            if (relatedPersons.father) {
                csvData += `${relatedPersons.father.id},"${relatedPersons.father.callname}","${relatedPersons.father.avatar}",`;
            } else {
                csvData += ',,,';
            }

            if (relatedPersons.mother) {
                csvData += `${relatedPersons.mother.id},"${relatedPersons.mother.callname}","${relatedPersons.mother.avatar}"\n`;
            } else {
                csvData += ',,\n';
            }
        });

        //const filePath = `backup_family_${userId}.csv`;
        //fs.writeFileSync(filePath, csvData);

        return csvData;
    } catch (error) {
        throw error;
    }
}

async function restoreFamilyDataFromCSV(data, newUserId) {
    const results = [];
    const rows = data.split('\n').filter(row => row.trim() !== ''); // Split data into rows and filter out empty lines
    const headers = rows.shift().split(','); // Get the headers

    rows.forEach(row => {
        const columns = row.split(','); // Split each row into columns
        const personId = parseInt(columns[0]);
        const callname = columns[1].replace(/"/g, '');
        const avatar = columns[2];
        const birthday = columns[3].replace(/"/g, '');
        const deathday = columns[4].replace(/"/g, '');
        const gender = columns[5].replace(/"/g, '');
        const isStandForUser = columns[6] ? parseInt(columns[6]) : null;
        const spouseId = columns[7] ? parseInt(columns[7]) : null;
        const spouseName = columns[8].replace(/"/g, '');
        const spouseAvatar = columns[9].replace(/"/g, '');
        const fatherId = columns[10] ? parseInt(columns[10]) : null;
        const fatherName = columns[11].replace(/"/g, '');
        const fatherAvatar = columns[12].replace(/"/g, '');
        const motherId = columns[13] ? parseInt(columns[13]) : null;
        const motherName = columns[14].replace(/"/g, '');
        const motherAvatar = columns[15].replace(/"/g, '');

        results.push({
            person: {
                id: personId,
                isStandForUser: isStandForUser
            },
            fields: {
                avatar: avatar,
                birthday: birthday,
                callname: callname,
                deathday: deathday,
                gender: gender
            },
            relatedPersons: {
                spouse: { id: spouseId, callname: spouseName, avatar: spouseAvatar },
                father: { id: fatherId, callname: fatherName, avatar: fatherAvatar },
                mother: { id: motherId, callname: motherName, avatar: motherAvatar }
            }
        });
    });

    for (const entry of results) {
        const person = entry.person;
        const fields = entry.fields;
        const relatedPersons = entry.relatedPersons;
        const searchString = fields.callname + " " + fields.gender;
        console.log(person,fields,relatedPersons);
        let personId = await personExists(newUserId, searchString);
        console.log("PersonID : ", personId);
        if (!personId) {
            personId = await insertPerson({
                ownerUserId: newUserId,
                searchString: searchString,
                isStandForUser: null
            });
            await insertFieldValue(personId, 1, "callname", fields.callname);
            await insertFieldValue(personId, 2, "gender", fields.gender);
            if (relatedPersons.spouse.id) {
                await insertFieldValue(personId, 3, "spouse", relatedPersons.spouse.id);
            }
            if (relatedPersons.father.id) {
                await insertFieldValue(personId, 4, "father", relatedPersons.father.id);
            }
            if (relatedPersons.mother.id) {
                await insertFieldValue(personId, 5, "mother", relatedPersons.mother.id);
            }
            await insertFieldValue(personId, 6, "birthday", fields.birthday);
            await insertFieldValue(personId, 7, "deathday", fields.deathday);
            await insertFieldValue(personId, 8, "avatar", fields.avatar);
        }
    }
    console.log('CSV file successfully processed');
}

module.exports = { backupFamilyDataToCSV, restoreFamilyDataFromCSV ,getAllBaseInfo};