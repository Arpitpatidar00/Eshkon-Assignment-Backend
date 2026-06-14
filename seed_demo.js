const path = require('path');
require('dotenv').config({ 
  path: process.cwd().endsWith('server') ? '.env' : 'server/.env' 
});
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');

async function run() {
  const uri = process.env.MONGODB_URI || process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/page-studio';
  console.log(`Connecting to MongoDB at: ${uri}`);
  await mongoose.connect(uri);
  
  // Define models inline for seeding
  const PageModel = mongoose.models.Page || mongoose.model('Page', new mongoose.Schema({
    pageId: String,
    slug: String,
    title: String,
    sections: [mongoose.Schema.Types.Mixed]
  }, { timestamps: true }));

  const UserModel = mongoose.models.User || mongoose.model('User', new mongoose.Schema({
    name: String,
    email: { type: String, unique: true },
    password: { type: String, select: false },
    role: String,
    isActive: { type: Boolean, default: true }
  }, { timestamps: true }));

  // 1. Seed Page Configuration
  const demoSections = [
    {
      id: `hero-${uuidv4().slice(0, 8)}`,
      type: 'hero',
      props: {
        title: 'Supercharge Your Workflow',
        subtitle: 'The only platform you need to build, scale, and launch faster than ever before. Join thousands of teams already succeeding.',
        ctaLabel: 'Start for free',
        ctaUrl: '#pricing',
      },
    },
    {
      id: `features-${uuidv4().slice(0, 8)}`,
      type: 'featureGrid',
      props: {
        heading: 'Everything you need to succeed',
        features: [
          {
            icon: '⚡️',
            title: 'Lightning Fast',
            description: 'Built on next-generation architecture to ensure your pages load instantly.',
          },
          {
            icon: '🔒',
            title: 'Secure by Default',
            description: 'Enterprise-grade security built into every layer of the platform.',
          },
          {
            icon: '🎨',
            title: 'Beautiful Design',
            description: 'Stunning templates and components that look great out of the box.',
          },
        ],
      },
    },
    {
      id: `testimonial-${uuidv4().slice(0, 8)}`,
      type: 'testimonial',
      props: {
        quote: 'This platform completely transformed how our team operates. We went from idea to launch in just under two weeks. Incredible experience!',
        author: 'Sarah Jenkins',
        role: 'CTO',
        company: 'TechFlow Inc.',
        rating: 5,
      },
    },
    {
      id: `cta-${uuidv4().slice(0, 8)}`,
      type: 'cta',
      props: {
        label: 'Get Started Now',
        url: '#signup',
        description: 'Ready to take your business to the next level? Join today.',
        variant: 'primary',
      },
    },
  ];

  console.log("Seeding home page configuration...");
  await PageModel.findOneAndUpdate(
    { slug: 'home' },
    {
      pageId: `page_${uuidv4()}`,
      slug: 'home',
      title: 'Demo Home Page',
      sections: demoSections
    },
    { upsert: true, new: true }
  );
  console.log("✅ Page 'home' seeded.");

  // 2. Seed Users
  console.log("Seeding demo users...");
  const salt = await bcrypt.genSalt(12);
  const defaultPasswordHash = await bcrypt.hash('password123', salt);

  const demoUsers = [
    {
      name: "Alex Viewer",
      email: "viewer@demo.com",
      password: defaultPasswordHash,
      role: "viewer"
    },
    {
      name: "Sam Editor",
      email: "editor@demo.com",
      password: defaultPasswordHash,
      role: "editor"
    },
    {
      name: "Jordan Publisher",
      email: "publisher@demo.com",
      password: defaultPasswordHash,
      role: "publisher"
    }
  ];

  for (const user of demoUsers) {
    await UserModel.findOneAndUpdate(
      { email: user.email },
      user,
      { upsert: true, new: true }
    );
    console.log(`✅ Seeded user: ${user.email} (${user.role})`);
  }

  console.log("\n🎉 Seeding complete! Login password for all users is: password123");
  process.exit(0);
}

run().catch(console.error);
