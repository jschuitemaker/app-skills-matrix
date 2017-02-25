const request = require('supertest');
const { expect } = require('chai');

const app = require('../backend');
const { sign, cookieName } = require('../backend/models/auth');
const { users, templates, skills, prepopulate, insertTemplate, insertSkill } = require('./helpers/prepopulate');

const prefix = '/skillz/matrices';

let adminToken, normalUserToken;
let adminUserId, normalUserId;

beforeEach(() =>
  prepopulate()
    .then(() =>
      Promise.all([users.findOne({ email: 'dmorgantini@gmail.com' }), users.findOne({ email: 'user@magic.com' })])
        .then(([adminUser, normalUser]) => {
          adminToken = sign({ email: adminUser.email, id: adminUser._id });
          normalUserToken = sign({ email: normalUser.email, id: normalUser._id });
          normalUserId = normalUser._id;
          adminUserId = adminUser._id;
        }))
    .then(() => templates.remove({}))
);

describe('POST /matrices/templates', () => {
  const sampleTemplate = {
    id: 1,
    name: 'Node.js',
    skillGroups: [
      {
        category: 'technicalSkill',
        level: 'novice',
        skills: [1,2]
      },
      {
        category: 'frontendDevelopment',
        level: 'novice',
        skills: [3,4]
      }
    ]
  };

  it('permits saving of new templates by admin users', () =>
    request(app)
      .post(`${prefix}/templates`)
      .send({  action: 'save', template: JSON.stringify(sampleTemplate) })
      .set('Cookie', `${cookieName}=${adminToken}`)
      .expect(201)
      .then((res) => templates.findOne({ id: 1 }))
      .then(newTemplate => {
        expect(newTemplate.id).to.equal(1);
        expect(newTemplate.name).to.equal('Node.js');
      })
  );

  it('updates an existing template when there is an existing template with the same id', () =>
    insertTemplate(Object.assign({}, sampleTemplate))
      .then(() =>
        request(app)
          .post(`${prefix}/templates`)
          .send({
            action: 'save',
            template: JSON.stringify(Object.assign({}, sampleTemplate, { name: 'new name', skillGroups: [] })) })
          .set('Cookie', `${cookieName}=${adminToken}`)
          .expect(201))
      .then(res => templates.findOne({ id: 1 }))
      .then(updatedTemplate => {
        expect(updatedTemplate.id).to.equal(1);
        expect(updatedTemplate.name).to.deep.equal('new name');
        expect(updatedTemplate.skillGroups.length).to.equal(0);
      }));

  const errorCases =
    [
      () => ({
        desc: 'not authorized',
        token: normalUserToken,
        body: { action: 'create', template: {} },
        expect: 403,
      }),
      () => ({
        desc: 'bad action',
        token: adminToken,
        body: { action: 'foo', template: {} },
        expect: 400,
      }),
    ];

  errorCases.forEach((test) =>
  it(`should handle error cases '${test().desc}'`, () =>
    request(app)
      .post(`${prefix}/templates`)
      .send(test().body)
      .set('Cookie', `${cookieName}=${test().token}`)
      .expect(test().expect)));
});

describe('POST matrices/skills', () => {
  const sampleSkill = {
    id: 1,
    name: 'Working knowledge of NodeJS',
    acceptanceCriteria: 'Understands the basics of NodeJS & es6 syntax',
    questions: [
      { title: 'Do you use ternary operators?' }
    ],
  };

  it('permits saving of new skills by admin users', () =>
    request(app)
      .post(`${prefix}/skills`)
      .send({
        action: 'save',
        skill: JSON.stringify(sampleSkill)
      })
      .set('Cookie', `${cookieName}=${adminToken}`)
      .expect(201)
      .then(res => skills.findOne({ id: 1 }))
      .then(newSkill => {
        expect(newSkill.id).to.equal(1);
        expect(newSkill.name).to.equal('Working knowledge of NodeJS');
      })
  );

  it('updates an existing skill when there is an existing skill with the same id', () =>
    insertSkill(Object.assign({}, sampleSkill))
      .then(() =>
        request(app)
          .post(`${prefix}/skills`)
          .send({
            action: 'save',
            skill: JSON.stringify(Object.assign({}, sampleSkill, { name: 'new name', questions: [] }))
          })
          .set('Cookie', `${cookieName}=${adminToken}`)
          .expect(201))
      .then(res => skills.findOne({ id: 1 }))
      .then(updatedSkill => {
        expect(updatedSkill.id).to.equal(1);
        expect(updatedSkill.name).to.deep.equal('new name');
        expect(updatedSkill.questions.length).to.equal(0);
      }));

  const errorCases =
    [
      () => ({
        desc: 'not authorized',
        token: normalUserToken,
        body: { action: 'create', skill: {} },
        expect: 403,
      }),
      () => ({
        desc: 'bad action',
        token: adminToken,
        body: { action: 'foo', skill: {} },
        expect: 400,
      }),
    ];

  errorCases.forEach((test) =>
  it(`should handle error cases '${test().desc}'`, () =>
    request(app)
      .post(`${prefix}/skills`)
      .send(test().body)
      .set('Cookie', `${cookieName}=${test().token}`)
      .expect(test().expect)));
});
