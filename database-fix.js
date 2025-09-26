/**
 * Database fix for PC approval issue
 * 
 * Run this script to fix the MongoDB index issue that's preventing PC approvals
 */

// Connect to your MongoDB database and run these commands:

// Option 1: Drop the problematic macAddress index
// db.pcs.dropIndex("macAddress_1")

// Option 2: Or add a macAddress field to existing PCs with null values
// db.pcs.updateMany(
//   { macAddress: { $exists: false } }, 
//   { $set: { macAddress: null } }
// )
// 
// Then create a partial unique index that ignores null values:
// db.pcs.createIndex(
//   { "macAddress": 1 }, 
//   { 
//     unique: true, 
//     sparse: true,  // This ignores documents where macAddress is null/missing
//     name: "macAddress_unique_sparse" 
//   }
// )

// Option 3: Set unique macAddress values for existing PCs
// db.pcs.find().forEach(function(doc) {
//   if (!doc.macAddress) {
//     db.pcs.updateOne(
//       { _id: doc._id },
//       { $set: { macAddress: doc.uniqueIdentifier || ObjectId().toString() } }
//     )
//   }
// })

export {};