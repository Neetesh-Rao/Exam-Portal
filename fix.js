const mongoose = require('mongoose');
mongoose.connect('mongodb+srv://neeteshyadav0206_db_user:RZiRPNu1GLUcQ4Ld@cluster0.8yj7l2x.mongodb.net/hiring-platform?appName=Cluster0')
.then(async () => {
  const db = mongoose.connection.db;
  const submissions = await db.collection('submissions').find({ companyId: { $exists: false } }).toArray();
  for (const sub of submissions) {
    const test = await db.collection('tests').findOne({ _id: sub.testId });
    if (test && test.companyId) {
      await db.collection('submissions').updateOne({ _id: sub._id }, { $set: { companyId: test.companyId } });
      console.log('Fixed submission', sub._id);
    }
  }
  console.log('Done');
  process.exit(0);
});
