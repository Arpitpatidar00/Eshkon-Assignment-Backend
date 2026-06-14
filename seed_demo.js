require('dotenv').config({ path: 'server/.env' });
const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');

async function run() {
  await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/pagestudio');
  const PageModel = mongoose.model('Page', new mongoose.Schema({
    pageId: String,
    slug: String,
    title: String,
    sections: [mongoose.Schema.Types.Mixed]
  }));

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

  console.log("Demo page seeded successfully!");
  process.exit(0);
}

run().catch(console.error);
