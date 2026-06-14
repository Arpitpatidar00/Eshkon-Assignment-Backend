import mongoose from 'mongoose';
import connectDB from '../src/db';
import PageModel from '../src/models/Page';

const seedData = [
  {
    pageId: "home",
    slug: "home",
    title: "Homepage",
    sections: [
      {
        id: "hero-1",
        type: "hero",
        props: {
          title: "Build Beautiful Landing Pages",
          subtitle: "Create, edit, and publish stunning pages with our intuitive Page Studio platform. No coding required.",
          ctaLabel: "Get Started Free",
          ctaUrl: "/signup"
        }
      },
      {
        id: "features-1",
        type: "featureGrid",
        props: {
          heading: "Everything You Need",
          features: [
            { icon: "⚡", title: "Lightning Fast", description: "Pages load in milliseconds." },
            { icon: "🎨", title: "Visual Editor", description: "Drag and drop sections." }
          ]
        }
      }
    ]
  },
  {
    pageId: "about",
    slug: "about",
    title: "About Us",
    sections: [
      {
        id: "hero-2",
        type: "hero",
        props: {
          title: "Our Story",
          subtitle: "We believe in empowering marketing teams to move faster.",
          ctaLabel: "Join the Team",
          ctaUrl: "/careers"
        }
      }
    ]
  }
];

const seedDB = async () => {
  try {
    await connectDB();
    console.log("Cleaning up existing Page drafts...");
    await PageModel.deleteMany({});
    
    console.log("Seeding initial Page drafts...");
    await PageModel.insertMany(seedData);
    
    console.log("✅ Seed complete!");
    process.exit(0);
  } catch (error) {
    console.error("Failed to seed:", error);
    process.exit(1);
  }
};

seedDB();
