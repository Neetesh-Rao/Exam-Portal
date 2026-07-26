const mongoose = require('mongoose');
mongoose.connect('mongodb+srv://neeteshyadav0206_db_user:RZiRPNu1GLUcQ4Ld@cluster0.8yj7l2x.mongodb.net/hiring-platform?appName=Cluster0')
.then(async () => {
  const db = mongoose.connection.db;
  await db.collection('submissions').updateOne(
    { _id: new mongoose.Types.ObjectId("6a65f2e5d1dccc04f6b4fd63") },
    { $set: { recordingSnapshots: [] } }
  );
  console.log('Cleaned oversized document');
  process.exit(0);
}).catch(err => {
  console.error(err);
  process.exit(1);
});
