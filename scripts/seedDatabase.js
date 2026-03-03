// scripts/seedDatabase.js
import admin from 'firebase-admin';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Initialize Firebase
const serviceAccount = JSON.parse(
  readFileSync(join(__dirname, '../serviceAccountKey.json'), 'utf8')
);

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();
const FieldValue = admin.firestore.FieldValue;
const Timestamp = admin.firestore.Timestamp;
const GeoPoint = admin.firestore.GeoPoint;

// ==================== UTILITY FUNCTIONS ====================

function createTimestamp(daysFromNow = 0) {
  const date = new Date();
  date.setDate(date.getDate() + daysFromNow);
  return Timestamp.fromDate(date);
}

function createPastTimestamp(daysAgo = 0) {
  const date = new Date();
  date.setDate(date.getDate() - daysAgo);
  return Timestamp.fromDate(date);
}

// ==================== DUMMY DATA ====================

const USERS_DATA = [
  {
    id: 'user_delhi_001',
    name: 'Rajesh Kumar',
    email: 'rajesh.kumar@example.com',
    photoUrl: 'https://i.pravatar.cc/150?img=12',
    location: 'Delhi',
    dob: '15/08/1995',
    role: 'user',
    totalPoints: 450,
    pointsPosted: 12,
    pointsSolved: 8,
    walletBalance: 2500,
    badges: ['Community Hero', 'First Event', 'Clean Champion'],
    workedTags: ['cleaning', 'potholes', 'community development'],
    comments: [],
    joinedGroups: [],
    postedServices: [],
    solvedServices: [],
    transactions: [],
    createdAt: createPastTimestamp(300),
  },
  {
    id: 'user_gurugram_001',
    name: 'Priya Sharma',
    email: 'priya.sharma@example.com',
    photoUrl: 'https://i.pravatar.cc/150?img=47',
    location: 'Gurugram',
    dob: '22/03/1998',
    role: 'user',
    totalPoints: 680,
    pointsPosted: 18,
    pointsSolved: 15,
    walletBalance: 3200,
    badges: ['Road Warrior', 'Problem Solver', 'Top Contributor'],
    workedTags: ['potholes', 'infrastructure', 'civic issues'],
    comments: [],
    joinedGroups: [],
    postedServices: [],
    solvedServices: [],
    transactions: [],
    createdAt: createPastTimestamp(270),
  },
  {
    id: 'user_faridabad_001',
    name: 'Amit Singh',
    email: 'amit.singh@example.com',
    photoUrl: 'https://i.pravatar.cc/150?img=33',
    location: 'Faridabad',
    dob: '10/11/1992',
    role: 'user',
    totalPoints: 520,
    pointsPosted: 15,
    pointsSolved: 10,
    walletBalance: 2800,
    badges: ['Park Protector', 'Green Warrior'],
    workedTags: ['cleaning', 'environment', 'parks'],
    comments: [],
    joinedGroups: [],
    postedServices: [],
    solvedServices: [],
    transactions: [],
    createdAt: createPastTimestamp(280),
  },
  {
    id: 'user_seoul_001',
    name: 'Kim Min-jun',
    email: 'kim.minjun@example.com',
    photoUrl: 'https://i.pravatar.cc/150?img=68',
    location: 'Seoul',
    dob: '05/07/1996',
    role: 'user',
    totalPoints: 890,
    pointsPosted: 22,
    pointsSolved: 18,
    walletBalance: 4500,
    badges: ['Seoul Champion', 'Community Leader', 'Event Master'],
    workedTags: ['cleaning', 'community', 'parks', 'environment'],
    comments: [],
    joinedGroups: [],
    postedServices: [],
    solvedServices: [],
    transactions: [],
    createdAt: createPastTimestamp(320),
  },
  {
    id: 'user_newyork_001',
    name: 'Sarah Johnson',
    email: 'sarah.johnson@example.com',
    photoUrl: 'https://i.pravatar.cc/150?img=45',
    location: 'New York',
    dob: '18/09/1994',
    role: 'user',
    totalPoints: 720,
    pointsPosted: 16,
    pointsSolved: 14,
    walletBalance: 3800,
    badges: ['NYC Helper', 'Problem Solver', 'Rising Star'],
    workedTags: ['food distribution', 'community', 'homeless support'],
    comments: [],
    joinedGroups: [],
    postedServices: [],
    solvedServices: [],
    transactions: [],
    createdAt: createPastTimestamp(290),
  },
  {
    id: 'user_delhi_002',
    name: 'Neha Verma',
    email: 'neha.verma@example.com',
    photoUrl: 'https://i.pravatar.cc/150?img=25',
    location: 'Delhi',
    dob: '12/05/1999',
    role: 'user',
    totalPoints: 320,
    pointsPosted: 8,
    pointsSolved: 5,
    walletBalance: 1800,
    badges: ['Newcomer', 'Helping Hand'],
    workedTags: ['cleaning', 'awareness'],
    comments: [],
    joinedGroups: [],
    postedServices: [],
    solvedServices: [],
    transactions: [],
    createdAt: createPastTimestamp(45),
  },
  {
    id: 'user_gurugram_002',
    name: 'Vikram Malhotra',
    email: 'vikram.malhotra@example.com',
    photoUrl: 'https://i.pravatar.cc/150?img=52',
    location: 'Gurugram',
    dob: '30/01/1991',
    role: 'user',
    totalPoints: 550,
    pointsPosted: 14,
    pointsSolved: 12,
    walletBalance: 2900,
    badges: ['Infrastructure Expert', 'Community Builder'],
    workedTags: ['potholes', 'roads', 'civic issues'],
    comments: [],
    joinedGroups: [],
    postedServices: [],
    solvedServices: [],
    transactions: [],
    createdAt: createPastTimestamp(200),
  },
  {
    id: 'jalbysGfAJZJ4mxmtz00NTSHwXI3',
    name: 'User 002',
    email: 'user002@gmail.com',
    photoUrl: 'https://firebasestorage.googleapis.com/',
    location: 'Delhi',
    dob: '30/2/2003',
    role: 'user',
    totalPoints: 40,
    pointsPosted: 22,
    pointsSolved: 0,
    walletBalance: 480,
    badges: ['the great one', 'the first one', 'the amazing one', 'first post'],
    workedTags: ['in ma home', 'in yor home', 'in yo mamas home', 'asssssssss'],
    comments: [],
    joinedGroups: [],
    postedServices: [],
    solvedServices: [],
    transactions: [],
    createdAt: createPastTimestamp(60),
  },
];

const GROUPS_DATA = [
  {
    id: 'group_delhi_parks',
    name: 'Clean Delhi Parks Initiative',
    description: 'Join us in keeping Delhi\'s parks clean and green. We organize weekly cleanup drives and tree plantation events to make our city more beautiful.',
    groupTitle: 'Delhi Green Initiative 2025',
    groupImage: 'https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?w=800&q=80',
    groupRules: [
      'Be respectful to all members and park visitors',
      'Attend at least one event per month to remain active',
      'Bring your own cleanup supplies (gloves, bags)',
      'No littering during or after events',
      'Share photos and updates after each event',
    ],
    tags: ['cleaning', 'environment', 'parks', 'community development', 'plantation'],
    postsCount: 0,
    solvedCount: 0,
  },
  {
    id: 'group_gurugram_potholes',
    name: 'Gurugram Pothole Patrol',
    description: 'Fed up with dangerous potholes? Join our community to report, track, and fix road issues in Gurugram.',
    groupTitle: 'Fix Our Roads Campaign',
    groupImage: 'https://images.unsplash.com/photo-1581094271901-8022df4466f9?w=800&q=80',
    groupRules: [
      'Document pothole locations with GPS coordinates',
      'Upload clear photos showing damage',
      'Follow up on reported issues weekly',
      'Coordinate with local authorities',
    ],
    tags: ['potholes', 'infrastructure', 'civic issues', 'community development'],
    postsCount: 0,
    solvedCount: 0,
  },
  {
    id: 'group_faridabad_parks',
    name: 'Faridabad Park Cleaners',
    description: 'Let\'s work together to maintain the beauty of Faridabad\'s parks. Weekend cleanup drives for all ages!',
    groupTitle: 'Park Maintenance Squad',
    groupImage: 'https://images.unsplash.com/photo-1585974738771-84483dd9f89f?w=800&q=80',
    groupRules: [
      'Respect all park property',
      'Separate waste properly',
      'Arrive on time for scheduled cleanups',
      'Bring your own gloves and bags',
    ],
    tags: ['cleaning', 'parks', 'environment', 'community'],
    postsCount: 0,
    solvedCount: 0,
  },
  {
    id: 'group_seoul_parks',
    name: 'Seoul Parks Community',
    description: 'For all park-related activities in Seoul, let\'s get together and maintain our city\'s green spaces.',
    groupTitle: 'Seoul Green Spaces Initiative',
    groupImage: 'https://images.unsplash.com/photo-1568515387631-8b650bbcdb90?w=800&q=80',
    groupRules: [
      'Follow Korean park regulations',
      'Respect local customs',
      'Use proper waste disposal',
      'Coordinate with park management',
    ],
    tags: ['cleaning', 'sewage', 'potholes', 'food distribution', 'plantation', 'animal welfare', 'environment', 'community development'],
    postsCount: 0,
    solvedCount: 0,
  },
  {
    id: 'group_newyork_community',
    name: 'NYC Community Care',
    description: 'Building a stronger NYC through volunteer work, food distribution, and homeless support.',
    groupTitle: 'NYC Volunteers United',
    groupImage: 'https://images.unsplash.com/photo-1514565131-fce0801e5785?w=800&q=80',
    groupRules: [
      'Maintain beneficiary confidentiality',
      'Follow food safety guidelines',
      'Be punctual for events',
      'Treat everyone with dignity',
    ],
    tags: ['food distribution', 'community', 'homeless support', 'charity'],
    postsCount: 0,
    solvedCount: 0,
  },
];

const EVENTS_DATA = [
  {
    id: 'event_delhi_park_cleanup_001',
    title: 'Nehru Park Major Cleanup Drive',
    description: 'Join us for a comprehensive cleanup of Nehru Park. We\'ll remove litter, trim overgrown areas, and plant 50 new saplings. All supplies provided!',
    category: 'high',
    priority: 'high',
    status: 'active',
    location: new GeoPoint(28.5672, 77.2100),
    date: createTimestamp(9),
    timeReqToInvest: 180,
    points: 150,
    reward: 150,
    donatedAmount: 5000,
    totalDonation: 10000,
    tags: ['cleaning', 'parks', 'environment', 'plantation'],
    imageUrl: 'https://images.unsplash.com/photo-1618477247222-acbdb0e159b3?w=800&q=80',
    participants: [],
    unsureParticipants: [],
    likes: [],
    dislikes: [],
    likeCount: 0,
    dislikeCount: 0,
    views: 15,
    reportedBy: [],
    donations: {},
    poll: null,
    groupId: null,
    verifiedParticipants: [],
  },
  {
    id: 'event_gurugram_pothole_fix_001',
    title: 'URGENT: Fix Sector 14 Main Road Potholes',
    description: 'Major potholes on Sector 14 main road causing accidents. Document, report, and follow up with authorities.',
    category: 'high',
    priority: 'high',
    status: 'active',
    location: new GeoPoint(28.4595, 77.0266),
    date: createTimestamp(6),
    timeReqToInvest: 90,
    points: 200,
    reward: 200,
    donatedAmount: 2000,
    totalDonation: 8000,
    tags: ['potholes', 'infrastructure', 'civic issues', 'urgent'],
    imageUrl: 'https://images.unsplash.com/photo-1581094271901-8022df4466f9?w=800&q=80',
    participants: [],
    unsureParticipants: [],
    likes: [],
    dislikes: [],
    likeCount: 0,
    dislikeCount: 0,
    views: 45,
    reportedBy: [],
    donations: {},
    poll: null,
    groupId: null,
    verifiedParticipants: [],
  },
  {
    id: 'event_seoul_park_cleanup_001',
    title: 'Clean All Parks in Seoul - Mega Event',
    description: 'Let us all get together and clean all major parks in Seoul for a better community!',
    category: 'high',
    priority: 'high',
    status: 'active',
    location: new GeoPoint(37.5665, 126.9780),
    date: createTimestamp(8),
    timeReqToInvest: 240,
    points: 200,
    reward: 200,
    donatedAmount: 8000,
    totalDonation: 15000,
    tags: ['cleaning', 'food', 'awareness', 'environment', 'community'],
    imageUrl: 'https://images.unsplash.com/photo-1583736914667-9ef32f93e835?w=800&q=80',
    participants: [],
    unsureParticipants: [],
    likes: [],
    dislikes: [],
    likeCount: 0,
    dislikeCount: 0,
    views: 67,
    reportedBy: [],
    donations: {},
    poll: null,
    groupId: null,
    verifiedParticipants: [],
  },
];

// ==================== SEEDING FUNCTIONS ====================

async function clearDatabase() {
  console.log('🗑️  Clearing existing data...');
  
  try {
    const collections = ['users', 'groups', 'events', 'transactions', 'leaderboard_cache'];
    
    for (const collectionName of collections) {
      const snapshot = await db.collection(collectionName).get();
      
      if (snapshot.empty) {
        console.log(`   ⚠️  ${collectionName} is already empty`);
        continue;
      }
      
      const batch = db.batch();
      snapshot.docs.forEach((doc) => {
        batch.delete(doc.ref);
      });
      
      await batch.commit();
      console.log(`   ✓ Cleared ${collectionName} (${snapshot.size} documents)`);
    }
    
    console.log('✅ Database cleared successfully\n');
  } catch (error) {
    console.error('❌ Error clearing database:', error);
    throw error;
  }
}

async function seedUsers() {
  console.log('👥 Seeding users...');
  
  try {
    const batch = db.batch();
    
    for (const user of USERS_DATA) {
      const userRef = db.collection('users').doc(user.id);
      batch.set(userRef, user);
    }
    
    await batch.commit();
    console.log(`   ✓ Created ${USERS_DATA.length} users\n`);
  } catch (error) {
    console.error('❌ Error seeding users:', error);
    throw error;
  }
}

async function seedGroups() {
  console.log('👥 Seeding groups...');
  
  try {
    const groupAssignments = {
      group_delhi_parks: ['user_delhi_001', 'user_delhi_002'],
      group_gurugram_potholes: ['user_gurugram_001', 'user_gurugram_002'],
      group_faridabad_parks: ['user_faridabad_001'],
      group_seoul_parks: ['user_seoul_001', 'jalbysGfAJZJ4mxmtz00NTSHwXI3'],
      group_newyork_community: ['user_newyork_001'],
    };
    
    const batch = db.batch();
    
    for (const group of GROUPS_DATA) {
      const groupRef = db.collection('groups').doc(group.id);
      const creatorId = groupAssignments[group.id][0];
      const creatorRef = db.doc(`users/${creatorId}`);
      
      const memberRefs = groupAssignments[group.id].map(
        userId => db.doc(`users/${userId}`)
      );
      
      batch.set(groupRef, {
        ...group,
        createdBy: creatorRef,
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
        admins: [creatorRef],
        members: memberRefs,
        events: [],
        services: [],
        providerMembers: [],
      });
    }
    
    await batch.commit();
    
    // Now update users' joinedGroups in a separate batch
    // This avoids the "No document to update" error
    const userUpdateBatch = db.batch();
    
    for (const [groupId, userIds] of Object.entries(groupAssignments)) {
      const groupRef = db.doc(`groups/${groupId}`);
      
      for (const userId of userIds) {
        const userRef = db.collection('users').doc(userId);
        userUpdateBatch.update(userRef, {
          joinedGroups: FieldValue.arrayUnion(groupRef),
        });
      }
    }
    
    await userUpdateBatch.commit();
    console.log(`   ✓ Created ${GROUPS_DATA.length} groups\n`);
  } catch (error) {
    console.error('❌ Error seeding groups:', error);
    throw error;
  }
}

async function seedEvents() {
  console.log('📅 Seeding events...');
  
  try {
    const eventGroupMapping = {
      event_delhi_park_cleanup_001: 'group_delhi_parks',
      event_delhi_tree_plantation_001: 'group_delhi_parks',
      event_delhi_awareness_001: 'group_delhi_parks',
      event_gurugram_pothole_fix_001: 'group_gurugram_potholes',
      event_gurugram_road_survey_001: 'group_gurugram_potholes',
      event_gurugram_drainage_001: 'group_gurugram_potholes',
      event_faridabad_park_cleanup_001: 'group_faridabad_parks',
      event_faridabad_awareness_001: 'group_faridabad_parks',
      event_faridabad_plantation_001: 'group_faridabad_parks',
      event_seoul_park_cleanup_001: 'group_seoul_parks',
      event_seoul_hangang_cleanup_001: 'group_seoul_parks',
      event_seoul_food_001: 'group_seoul_parks',
      event_newyork_food_distribution_001: 'group_newyork_community',
      event_newyork_central_park_cleanup_001: 'group_newyork_community',
      event_newyork_shelter_001: 'group_newyork_community',
    };
    
    const eventCreatorMapping = {
      event_delhi_park_cleanup_001: 'user_delhi_001',
      event_delhi_tree_plantation_001: 'user_delhi_001',
      event_delhi_awareness_001: 'user_delhi_002',
      event_gurugram_pothole_fix_001: 'user_gurugram_001',
      event_gurugram_road_survey_001: 'user_gurugram_002',
      event_gurugram_drainage_001: 'user_gurugram_001',
      event_faridabad_park_cleanup_001: 'user_faridabad_001',
      event_faridabad_awareness_001: 'user_faridabad_001',
      event_faridabad_plantation_001: 'user_faridabad_001',
      event_seoul_park_cleanup_001: 'user_seoul_001',
      event_seoul_hangang_cleanup_001: 'user_seoul_001',
      event_seoul_food_001: 'user_seoul_001',
      event_newyork_food_distribution_001: 'user_newyork_001',
      event_newyork_central_park_cleanup_001: 'user_newyork_001',
      event_newyork_shelter_001: 'user_newyork_001',
    };
    
    const batch = db.batch();
    
    for (const event of EVENTS_DATA) {
      const eventRef = db.collection('events').doc(event.id);
      const creatorId = eventCreatorMapping[event.id];
      const creatorRef = db.doc(`users/${creatorId}`);
      
      const groupId = eventGroupMapping[event.id];
      const groupRef = groupId ? db.doc(`groups/${groupId}`) : null;
      
      const groupIdField = groupRef ? [groupRef] : [];
      
      batch.set(eventRef, {
        ...event,
        createdBy: creatorRef,
        groupId: groupIdField,
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
      });
      
      if (groupRef) {
        batch.update(groupRef, {
          events: FieldValue.arrayUnion(eventRef),
          postsCount: FieldValue.increment(1),
        });
      }
    }
    
    await batch.commit();
    console.log(`   ✓ Created ${EVENTS_DATA.length} events\n`);
  } catch (error) {
    console.error('❌ Error seeding events:', error);
    throw error;
  }
}

async function updateLeaderboardCache() {
  console.log('🏆 Updating leaderboard cache...');
  
  try {
    const usersSnapshot = await db.collection('users').get();
    const users = usersSnapshot.docs.map(doc => ({
      id: doc.id,
      uid: doc.id,
      ...doc.data(),
    }));
    
    const topPoints = [...users].sort((a, b) => (b.totalPoints || 0) - (a.totalPoints || 0)).slice(0, 50);
    const topPosters = [...users].sort((a, b) => (b.pointsPosted || 0) - (a.pointsPosted || 0)).slice(0, 50);
    const topSolvers = [...users].sort((a, b) => (b.pointsSolved || 0) - (a.pointsSolved || 0)).slice(0, 50);
    
    const batch = db.batch();
    const timestamp = Timestamp.now();
    
    batch.set(db.collection('leaderboard_cache').doc('topPoints'), {
      data: topPoints,
      updatedAt: timestamp,
    });
    
    batch.set(db.collection('leaderboard_cache').doc('topPosters'), {
      data: topPosters,
      updatedAt: timestamp,
    });
    
    batch.set(db.collection('leaderboard_cache').doc('topSolvers'), {
      data: topSolvers,
      updatedAt: timestamp,
    });
    
    batch.set(db.collection('leaderboard_cache').doc('risingStars'), {
      data: topPoints.slice(0, 10),
      updatedAt: timestamp,
    });
    
    await batch.commit();
    console.log('   ✓ Leaderboard cache updated\n');
  } catch (error) {
    console.error('❌ Error updating leaderboard:', error);
  }
}

async function seedTransactions() {
  console.log('💰 Seeding sample transactions...');
  
  try {
    const transactions = [
      {
        id: 'txn_001',
        amount: 100,
        method: 'online',
        status: 'completed',
        PayerStatus: 'completed',
        RecieverStatus: 'completed',
        userPaying: db.doc('users/user_delhi_001'),
        userRecieving: db.doc('users/user_delhi_002'),
        serviceId: null,
        createdAt: createPastTimestamp(10),
      },
      {
        id: 'txn_002',
        amount: 200,
        method: 'online',
        status: 'completed',
        PayerStatus: 'completed',
        RecieverStatus: 'completed',
        userPaying: db.doc('users/user_gurugram_001'),
        userRecieving: db.doc('users/user_gurugram_002'),
        serviceId: null,
        createdAt: createPastTimestamp(8),
      },
      {
        id: 'txn_003',
        amount: 150,
        method: 'wallet',
        status: 'pending',
        PayerStatus: 'pending',
        RecieverStatus: 'pending',
        userPaying: db.doc('users/user_seoul_001'),
        userRecieving: db.doc('users/jalbysGfAJZJ4mxmtz00NTSHwXI3'),
        serviceId: null,
        createdAt: createPastTimestamp(5),
      },
      {
        id: 'txn_004',
        amount: 300,
        method: 'online',
        status: 'completed',
        PayerStatus: 'completed',
        RecieverStatus: 'completed',
        userPaying: db.doc('users/user_newyork_001'),
        userRecieving: db.doc('users/user_faridabad_001'),
        serviceId: null,
        createdAt: createPastTimestamp(3),
      },
    ];
    
    const batch = db.batch();
    
    for (const txn of transactions) {
      const txnRef = db.collection('transactions').doc(txn.id);
      batch.set(txnRef, txn);
    }
    
    await batch.commit();
    console.log(`   ✓ Created ${transactions.length} transactions\n`);
  } catch (error) {
    console.error('❌ Error seeding transactions:', error);
  }
}

async function verifyData() {
  console.log('🔍 Verifying data...\n');
  
  try {
    const [users, groups, events, transactions] = await Promise.all([
      db.collection('users').get(),
      db.collection('groups').get(),
      db.collection('events').get(),
      db.collection('transactions').get(),
    ]);
    
    console.log('📊 Database Contents:');
    console.log(`   • Users: ${users.size} documents`);
    console.log(`   • Groups: ${groups.size} documents`);
    console.log(`   • Events: ${events.size} documents`);
    console.log(`   • Transactions: ${transactions.size} documents\n`);
    
    if (groups.size > 0) {
      console.log('👥 Groups created:');
      groups.forEach(doc => {
        console.log(`   • ${doc.data().name}`);
      });
      console.log('');
    }
    
    if (events.size > 0) {
      console.log('📅 Events created:');
      events.forEach(doc => {
        console.log(`   • ${doc.data().title}`);
      });
      console.log('');
    }
    
    // Check if groups actually have events
    console.log('🔗 Checking group-event relationships:');
    for (const groupDoc of groups.docs) {
      const groupData = groupDoc.data();
      console.log(`   • ${groupData.name}: ${groupData.events?.length || 0} events`);
    }
    console.log('');
    
  } catch (error) {
    console.error('❌ Error verifying data:', error);
  }
}

// ==================== MAIN EXECUTION ====================

async function main() {
  console.log('\n🚀 Starting Database Seeding Process...\n');
  console.log('⚠️  WARNING: This will clear all existing data!\n');
  
  try {
    // Step 1: Clear database
    await clearDatabase();
    
    // Step 2: Seed users
    await seedUsers();
    
    // Step 3: Seed groups
    await seedGroups();
    
    // Step 4: Seed events
    await seedEvents();
    
    // Step 5: Seed transactions
    await seedTransactions();
    
    // Step 6: Update leaderboard
    await updateLeaderboardCache();
    
    // Step 7: Verify everything was created
    await verifyData();
    
    console.log('✅ Database seeding completed successfully!\n');
    console.log('💡 Check your Firebase Console to see the data');
    console.log('🔗 https://console.firebase.google.com/project/betterment-64363/firestore\n');
    
    process.exit(0);
  } catch (error) {
    console.error('\n❌ FATAL ERROR:', error);
    process.exit(1);
  }
}

main();