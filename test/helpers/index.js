const usersData = require('../fixtures/users');
const templatesData = require('../fixtures/templates');
const database = require('../../backend/database');

const users = database.collection('users');
const templates = database.collection('templates');
const skills = database.collection('skills');
const evaluations = database.collection('evaluations');

const prepopulateUsers = () => users.remove({}).then(() => users.insertMany(usersData));

module.exports = {
  prepopulateUsers,
  users,
  templates,
  insertTemplate: (template) => templates.insertOne(Object.assign({}, template)),
  skills,
  insertSkill: (skill) => skills.insertOne(Object.assign({}, skill)),
  evaluations,
  insertEvaluation: (evaluation) => evaluations.insertOne(Object.assign({}, evaluation)),
  clearDb: () => Promise.all([users.remove({}), templates.remove({}), skills.remove({}), evaluations.remove({})])
};