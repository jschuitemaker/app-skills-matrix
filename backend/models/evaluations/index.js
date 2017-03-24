const database = require('../../database');
const evaluationsCollection = database.collection('evaluations');
const { ObjectId } = require('mongodb');

const evaluation = require('./evaluation');
const { encrypt, decrypt } = require('./encryption');

evaluationsCollection.ensureIndex({ 'user.id': 1 }, { background: true });

module.exports = {
  addEvaluation: function (newEvaluation) {
    return evaluationsCollection.insertOne(encrypt(newEvaluation))
      .then(({ insertedId }) => evaluationsCollection.findOne({ _id: new ObjectId(insertedId) }))
      .then((res) => res ? evaluation(decrypt(res)) : null);
  },
  getEvaluationById: function (id) {
    return evaluationsCollection.findOne({ _id: ObjectId(id) })
      .then(res => res ? evaluation(decrypt(res)) : null);
  },
  getByUserId: function (userId) {
    return evaluationsCollection.find({ 'user.id': userId })
      .then(res => res.toArray())
      .then(res => res.map((e) => evaluation(decrypt(e))))
  },
  updateEvaluation: function (updatedEvaluation) {
    return evaluationsCollection.updateOne(
      { _id: ObjectId(updatedEvaluation.id) },
      { $set: encrypt(updatedEvaluation) }
    )
      .then(() => evaluationsCollection.findOne({ _id: ObjectId(updatedEvaluation.id) }))
      .then((res) => res ? evaluation(decrypt(res)) : null)
  }
};
