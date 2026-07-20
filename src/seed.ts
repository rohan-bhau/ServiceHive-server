import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import 'dotenv/config';
import User from './models/User';
import Service from './models/Service';
import Review from './models/Review';
import Booking from './models/Booking';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/servicehive';

const CATEGORIES = [
  'Home Repair',
  'Tutoring',
  'Design & Creative',
  'Fitness & Health',
  'Cleaning',
];

const CITIES = ['San Francisco', 'New York', 'Los Angeles', 'Chicago', 'Seattle'];

interface ServiceSeedData {
  title: string;
  shortDescription: string;
  fullDescription: string;
  category: string;
  price: number;
  priceUnit: 'per_hour' | 'fixed';
  location: string;
  city: string;
  images: string[];
  tags: string[];
  availability: string;
}

const SERVICES_DATA: ServiceSeedData[] = [
  {
    title: 'Emergency Plumbing & Leak Repair',
    shortDescription: 'Professional plumbing services including leak detection, pipe replacement, and drain cleaning.',
    fullDescription: 'We offer fast, reliable plumbing solutions for residential and commercial properties. Available for urgent calls 24/7. Our licensed technicians handle clogged toilets, leaking pipes, faucet repairs, water heaters, and garbage disposals with standard workmanship warranties.',
    category: 'Home Repair',
    price: 95,
    priceUnit: 'per_hour',
    location: 'Client\'s Home',
    city: 'San Francisco',
    images: ['https://images.unsplash.com/photo-1504328345606-18bbc8c9d7d1?auto=format&fit=crop&w=600&q=80'],
    tags: ['plumbing', 'leak', 'pipe-repair', 'drain'],
    availability: '24/7 Emergency Service',
  },
  {
    title: 'Professional Home Electrical Repair',
    shortDescription: 'Certified electrical repairs, outlet installations, and smart home wiring solutions.',
    fullDescription: 'Get safe and certified electrical service from experienced local electricians. We cover light fixture installations, circuit breaker troubleshooting, panel upgrades, outlet replacements, and smart home hub configuration. Licensed and fully insured.',
    category: 'Home Repair',
    price: 110,
    priceUnit: 'per_hour',
    location: 'Client\'s Home',
    city: 'San Francisco',
    images: ['https://images.unsplash.com/photo-1621905251189-08b45d6a269e?auto=format&fit=crop&w=600&q=80'],
    tags: ['electrician', 'wiring', 'smart-home', 'outlet'],
    availability: 'Mon-Fri 8AM - 6PM',
  },
  {
    title: 'Handyman General Carpentry & Assembly',
    shortDescription: 'Door replacements, deck repairs, furniture assembly, and shelving mounts.',
    fullDescription: 'No job is too small for our expert carpentry and assembly service. We assemble IKEA furniture, hang cabinets, repair drywall, mount TVs, repair fences, and fix squeaky doors. Friendly, fast, and equipped with all necessary tools.',
    category: 'Home Repair',
    price: 75,
    priceUnit: 'per_hour',
    location: 'Client\'s Home',
    city: 'Los Angeles',
    images: ['https://images.unsplash.com/photo-1534088568595-a066f410bcda?auto=format&fit=crop&w=600&q=80'],
    tags: ['handyman', 'carpentry', 'furniture-assembly', 'drywall'],
    availability: 'Daily 9AM - 5PM',
  },
  {
    title: 'High School Algebra & Calculus Tutoring',
    shortDescription: 'Unlock your potential in mathematics. Standard high school and college prep tutoring.',
    fullDescription: 'Experienced tutor with a Mathematics degree offering personalized algebra, geometry, trigonometry, and AP Calculus prep. We review core concepts, solve sample assignments together, and build strong exam-taking strategies. Online and in-person options.',
    category: 'Tutoring',
    price: 45,
    priceUnit: 'per_hour',
    location: 'Online / Library',
    city: 'San Francisco',
    images: ['https://images.unsplash.com/photo-1434030216411-0b793f4b4173?auto=format&fit=crop&w=600&q=80'],
    tags: ['math', 'calculus', 'algebra', 'high-school', 'tutor'],
    availability: 'Weekdays 4PM - 9PM, Sat 9AM - 3PM',
  },
  {
    title: 'Spanish Language Conversations & Grammar',
    shortDescription: 'Accelerate your Spanish speaking confidence with native-level conversational classes.',
    fullDescription: 'Interactive conversational Spanish for beginners and intermediate speakers. We focus on daily conversation patterns, vocabulary enrichment, essential travel phrases, and clear pronunciation. Tailored classes for children and adults.',
    category: 'Tutoring',
    price: 35,
    priceUnit: 'per_hour',
    location: 'Online',
    city: 'New York',
    images: ['https://images.unsplash.com/photo-1544717305-2782549b5136?auto=format&fit=crop&w=600&q=80'],
    tags: ['spanish', 'language', 'conversation', 'espanol'],
    availability: 'Flexible Schedule',
  },
  {
    title: 'Coding Bootcamp Prep — JS & React',
    shortDescription: 'One-on-one JavaScript, HTML/CSS, and React tutoring to kickstart your tech career.',
    fullDescription: 'Get mentored by a senior software engineer. We build real-world portfolios, debug complex algorithms, understand async API patterns, and get ready for coding bootcamp entry challenges. Comprehensive study guides included.',
    category: 'Tutoring',
    price: 60,
    priceUnit: 'per_hour',
    location: 'Online',
    city: 'Seattle',
    images: ['https://images.unsplash.com/photo-1515378791036-0648a3ef77b2?auto=format&fit=crop&w=600&q=80'],
    tags: ['coding', 'javascript', 'react', 'frontend', 'mentor'],
    availability: 'Mon-Thu 6PM - 10PM',
  },
  {
    title: 'Modern Brand Identity & Logo Design',
    shortDescription: 'Get a custom brand book, typography selection, color palette, and vector logos.',
    fullDescription: 'Establish a memorable corporate presence. We deliver 3 distinct logo concepts, custom vector icons, social media headers, professional color palettes, and typographic design specifications. Ideal for local startups and small businesses.',
    category: 'Design & Creative',
    price: 450,
    priceUnit: 'fixed',
    location: 'Online',
    city: 'New York',
    images: ['https://images.unsplash.com/photo-1626785774573-4b799315345d?auto=format&fit=crop&w=600&q=80'],
    tags: ['logo', 'brand-identity', 'design', 'vector', 'graphics'],
    availability: 'Project-based delivery in 7 days',
  },
  {
    title: 'Custom Wedding & Portrait Photography',
    shortDescription: 'Capture your special moments with high-resolution portraits and professional retouching.',
    fullDescription: 'Professional wedding and event photographer. Package includes 4 hours of live coverage, 150+ fully edited high-resolution digital files, personal web gallery download, and pre-event timeline consultation. Travel costs included within local area.',
    category: 'Design & Creative',
    price: 800,
    priceUnit: 'fixed',
    location: 'On Location',
    city: 'San Francisco',
    images: ['https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=600&q=80'],
    tags: ['photography', 'wedding', 'portrait', 'photoshoot'],
    availability: 'Weekends (Advanced booking required)',
  },
  {
    title: 'WordPress Website Setup & SEO Optimization',
    shortDescription: 'Get a fully responsive business website setup with basic SEO, contact form, and hosting configuration.',
    fullDescription: 'We launch a premium-design WordPress website optimized for search rankings. Features include clean contact forms, fast load times, Google Analytics installation, mobile responsiveness, and a 1-hour coaching session to manage updates.',
    category: 'Design & Creative',
    price: 650,
    priceUnit: 'fixed',
    location: 'Online',
    city: 'Seattle',
    images: ['https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=600&q=80'],
    tags: ['wordpress', 'website', 'seo', 'web-design'],
    availability: 'Project-based delivery in 10 days',
  },
  {
    title: '1-on-1 Personal Fitness Coaching',
    shortDescription: 'Custom weight training workouts, cardio plans, and holistic nutrition counseling.',
    fullDescription: 'Certified personal trainer (NASM) dedicated to helping you achieve weight loss, muscle gain, or endurance goals. Includes weekly check-ins, custom macro nutrition templates, form safety corrections, and gym workout routines. Suitable for all ages.',
    category: 'Fitness & Health',
    price: 55,
    priceUnit: 'per_hour',
    location: 'Local Gym / Park',
    city: 'San Francisco',
    images: ['https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?auto=format&fit=crop&w=600&q=80'],
    tags: ['fitness', 'workout', 'personal-trainer', 'weight-loss', 'diet'],
    availability: 'Daily 6AM - 8PM',
  },
  {
    title: 'Vinyasa Yoga Classes (Private & Group)',
    shortDescription: 'Relax and build core strength with flow-based yoga classes for all experience levels.',
    fullDescription: 'Registered Yoga Teacher (RYT-200) offering custom sessions focusing on breathing alignment, flexibility development, posture correction, and mindfulness meditation. Mats and blocks provided upon request.',
    category: 'Fitness & Health',
    price: 50,
    priceUnit: 'per_hour',
    location: 'Client\'s Home / Park',
    city: 'Chicago',
    images: ['https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?auto=format&fit=crop&w=600&q=80'],
    tags: ['yoga', 'vinyasa', 'meditation', 'flexibility'],
    availability: 'Mon, Wed, Fri 7AM - 11AM',
  },
  {
    title: 'Deep House Cleaning & Organizing',
    shortDescription: 'Detailed residential house cleaning, vacuuming, window wash, and kitchen sanitation.',
    fullDescription: 'Leave the scrubbing to us! Complete residential cleaning package including dusting, mopping, bathroom disinfection, kitchen appliance wipe-downs, and trash disposal. Eco-friendly cleaning products used. Satisfaction guaranteed.',
    category: 'Cleaning',
    price: 40,
    priceUnit: 'per_hour',
    location: 'Client\'s Home',
    city: 'San Francisco',
    images: ['https://images.unsplash.com/photo-1581578731548-c64695cc6952?auto=format&fit=crop&w=600&q=80'],
    tags: ['cleaning', 'housekeeping', 'maid-service', 'organizing'],
    availability: 'Mon-Sat 8AM - 5PM',
  },
  {
    title: 'Eco-Friendly Office & Commercial Cleaning',
    shortDescription: 'High-quality janitorial services, floor polishing, and desk sanitization for offices.',
    fullDescription: 'Maintain a pristine working environment. We clean meeting rooms, sanitize restrooms, clean kitchen areas, vacuum floors, and empty bins. Customizable schedules (nightly, weekly, bi-weekly) to suit your business hours.',
    category: 'Cleaning',
    price: 45,
    priceUnit: 'per_hour',
    location: 'Client\'s Office',
    city: 'New York',
    images: ['https://images.unsplash.com/photo-1527515637462-cff94eecc1ac?auto=format&fit=crop&w=600&q=80'],
    tags: ['commercial-cleaning', 'office', 'janitor', 'disinfection'],
    availability: 'Weekends & After-hours',
  },
];

const TESTIMONIAL_COMMENTS = [
  'Absolutely fantastic! Prompt, professional, and went above and beyond my expectations.',
  'Great communication and outstanding results. I will definitely book this service again.',
  'Highly recommend. Very skilled, polite, and finished the job in record time.',
  'Excellent value for money. Very professional work and clean cleanup afterwards.',
  'Super helpful and easy to work with. My kids loved the tutoring session!',
  'The design work was top notch and fit our brand requirements perfectly.',
  'Reliable, punctual, and highly experienced. Best service in the area!',
  'Great trainer! Very encouraging and focused heavily on workout form safety.',
  'Cleaned my entire apartment spotlessly. Will sign up for a bi-weekly contract.',
  'Really helped me structure my coding projects. Absolute lifesaver.',
];

async function seed() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');

    // 1. Clear existing collections
    await User.deleteMany({});
    await Service.deleteMany({});
    await Review.deleteMany({});
    await Booking.deleteMany({});
    console.log('Cleared all collections');

    const passwordHash = await bcrypt.hash('password123', 12);
    const adminPasswordHash = await bcrypt.hash('admin123', 12);

    // 2. Create Users
    const adminUser = await User.create({
      name: 'Super Admin',
      email: 'admin@servicehive.com',
      passwordHash: adminPasswordHash,
      role: 'admin',
      bio: 'Platform administrator.',
      location: 'San Francisco, CA',
    });

    const demoCustomer = await User.create({
      name: 'Demo Customer',
      email: 'demo@servicehive.com',
      passwordHash,
      role: 'customer',
      bio: 'A demo customer account for testing ServiceHive.',
      location: 'San Francisco, CA',
      phone: '+1 (555) 123-4567',
    });

    const demoProvider = await User.create({
      name: 'Demo Provider',
      email: 'provider@servicehive.com',
      passwordHash,
      role: 'provider',
      bio: 'Professional service provider with 5+ years of experience.',
      location: 'San Francisco, CA',
      phone: '+1 (555) 987-6543',
    });

    const customers: any[] = [];
    const customerNames = ['Emma Watson', 'Liam Neeson', 'Sophia Loren', 'Lucas Silva', 'Olivia Wilde'];
    for (let i = 0; i < customerNames.length; i++) {
      const c = await User.create({
        name: customerNames[i],
        email: `customer${i + 1}@servicehive.com`,
        passwordHash,
        role: 'customer',
        bio: `Local service buyer looking for top-rated professionals.`,
        location: CITIES[i],
        phone: `+1 (555) 321-456${i}`,
      });
      customers.push(c);
    }

    const providers: any[] = [demoProvider];
    const providerNames = ['Marcus Aurelius', 'Ada Lovelace', 'Vincent van Gogh'];
    for (let i = 0; i < providerNames.length; i++) {
      const p = await User.create({
        name: providerNames[i],
        email: `provider${i + 1}@servicehive.com`,
        passwordHash,
        role: 'provider',
        bio: `Skilled professional focusing on premium, custom results.`,
        location: CITIES[i + 1] || 'San Francisco',
        phone: `+1 (555) 789-123${i}`,
      });
      providers.push(p);
    }
    console.log('Seeded Users.');

    // 3. Create Services
    const services: any[] = [];
    for (let i = 0; i < SERVICES_DATA.length; i++) {
      const serviceData = SERVICES_DATA[i];
      const provider = providers[i % providers.length];
      const service = await Service.create({
        ...serviceData,
        providerId: provider._id,
        status: 'active',
        isApproved: true,
        avgRating: 0,
        reviewCount: 0,
      });
      services.push(service);
    }
    console.log(`Seeded ${services.length} services.`);

    // 4. Create Reviews
    console.log('Seeding reviews and calculating ratings...');
    const allCustomers = [demoCustomer, ...customers];
    for (const service of services) {
      const reviewCount = Math.floor(Math.random() * 3) + 3;
      let ratingSum = 0;
      for (let j = 0; j < reviewCount; j++) {
        let reviewer = allCustomers[Math.floor(Math.random() * allCustomers.length)];
        while (reviewer._id.toString() === service.providerId.toString()) {
          reviewer = allCustomers[Math.floor(Math.random() * allCustomers.length)];
        }
        const rating = Math.floor(Math.random() * 2) + 4;
        const comment = TESTIMONIAL_COMMENTS[Math.floor(Math.random() * TESTIMONIAL_COMMENTS.length)];
        await Review.create({
          serviceId: service._id,
          userId: reviewer._id,
          rating,
          comment,
        });
        ratingSum += rating;
      }
      service.reviewCount = reviewCount;
      service.avgRating = Math.round((ratingSum / reviewCount) * 10) / 10;
      await service.save();
    }
    console.log('Seeded Reviews.');

    // 5. Create Bookings
    console.log('Seeding bookings...');
    const bookingStatuses = ['completed', 'completed', 'confirmed', 'pending', 'cancelled'] as const;
    const bookingDates = [
      new Date(Date.now() - 15 * 24 * 60 * 60 * 1000),
      new Date(Date.now() - 8 * 24 * 60 * 60 * 1000),
      new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
      new Date(Date.now() + 1 * 24 * 60 * 60 * 1000),
      new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
    ];
    for (let i = 0; i < 12; i++) {
      const service = services[i % services.length];
      const customer = allCustomers[i % allCustomers.length];
      if (customer._id.toString() === service.providerId.toString()) {
        continue;
      }
      const dateIndex = i % bookingDates.length;
      const statusIndex = i % bookingStatuses.length;
      await Booking.create({
        serviceId: service._id,
        customerId: customer._id,
        providerId: service.providerId,
        date: bookingDates[dateIndex],
        status: bookingStatuses[statusIndex],
        notes: `Test booking notes for order #${i + 1}.`,
        createdAt: bookingDates[dateIndex],
      });
    }
    console.log('Seeded Bookings.');

    console.log('\nSeed Database Summary:');
    console.log(`- Admin: ${adminUser.email} / admin123`);
    console.log(`- Core Demo Customer: ${demoCustomer.email} / password123`);
    console.log(`- Core Demo Provider: ${demoProvider.email} / password123`);
    console.log(`- Total Users: ${await User.countDocuments()}`);
    console.log(`- Total Services: ${await Service.countDocuments()}`);
    console.log(`- Total Reviews: ${await Review.countDocuments()}`);
    console.log(`- Total Bookings: ${await Booking.countDocuments()}`);

    await mongoose.disconnect();
    console.log('Done. Database disconnected.');
    process.exit(0);
  } catch (err) {
    console.error('Seed error:', err);
    process.exit(1);
  }
}

seed();
