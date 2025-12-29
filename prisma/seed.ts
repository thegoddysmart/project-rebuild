import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { hash } from "bcryptjs";

if (typeof process.loadEnvFile === "function") {
  process.loadEnvFile();
}

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("🌱 Seeding database...");

  const superAdminPassword = await hash("SuperAdmin@123", 12);
  const adminPassword = await hash("Admin@123", 12);
  const organizerPassword = await hash("Organizer@123", 12);

  const superAdmin = await prisma.user.upsert({
    where: { email: "super@easevotegh.com" },
    update: {},
    create: {
      email: "super@easevotegh.com",
      name: "Super Administrator",
      passwordHash: superAdminPassword,
      role: "SUPER_ADMIN",
      status: "ACTIVE",
      emailVerified: new Date(),
      phone: "+233550073142",
    },
  });
  console.log("✅ Super Admin created:", superAdmin.email);

  const admin = await prisma.user.upsert({
    where: { email: "admin@easevotegh.com" },
    update: {},
    create: {
      email: "admin@easevotegh.com",
      name: "Platform Administrator",
      passwordHash: adminPassword,
      role: "ADMIN",
      status: "ACTIVE",
      emailVerified: new Date(),
      phone: "+233554440813",
    },
  });
  console.log("✅ Admin created:", admin.email);

  const organizer = await prisma.user.upsert({
    where: { email: "organizer@easevotegh.com" },
    update: {},
    create: {
      email: "organizer@easevotegh.com",
      name: "Demo Organizer",
      passwordHash: organizerPassword,
      role: "ORGANIZER",
      status: "ACTIVE",
      emailVerified: new Date(),
      phone: "+233559540992",
      organizerProfile: {
        create: {
          businessName: "Event Masters Ghana",
          businessEmail: "events@eventmasters.gh",
          businessPhone: "+233559540992",
          address: "15 Independence Avenue",
          city: "Accra",
          region: "Greater Accra",
          description: "Premier event management company in Ghana",
          bankName: "GCB Bank",
          bankAccountName: "Event Masters Ghana Ltd",
          bankAccountNumber: "1234567890",
          verified: true,
          verifiedAt: new Date(),
          commissionRate: 10.0,
        },
      },
    },
    include: { organizerProfile: true },
  });
  console.log("✅ Organizer created:", organizer.email);

  if (organizer.organizerProfile) {
    const event = await prisma.event.upsert({
      where: { eventCode: "GMA2025" },
      update: {},
      create: {
        eventCode: "GMA2025",
        title: "Ghana Music Awards 2025",
        description: "The biggest night in Ghana music celebrating excellence.",
        type: "VOTING",
        status: "LIVE",
        coverImage: "https://picsum.photos/seed/gma/800/600",
        startDate: new Date("2025-01-01"),
        endDate: new Date("2025-12-31"),
        votePrice: 1.0,
        location: "Accra, Ghana",
        venue: "Accra International Conference Centre",
        isPublic: true,
        organizerId: organizer.organizerProfile.id,
        totalVotes: 154200,
        totalRevenue: 154200.0,
      },
    });

    const category = await prisma.eventCategory.upsert({
      where: { id: "cat-artiste-of-year" },
      update: {},
      create: {
        id: "cat-artiste-of-year",
        eventId: event.id,
        name: "Artiste of the Year",
        description: "Celebrating the most outstanding artist of the year",
        sortOrder: 1,
        totalVotes: 165000,
      },
    });

    const candidates = [
      { code: "BS", name: "Black Sherif", votes: 45000 },
      { code: "SK", name: "Sarkodie", votes: 42000 },
      { code: "ST", name: "Stonebwoy", votes: 40000 },
      { code: "SW", name: "Shatta Wale", votes: 38000 },
    ];

    for (const cand of candidates) {
      await prisma.candidate.upsert({
        where: {
          categoryId_code: {
            categoryId: category.id,
            code: cand.code,
          },
        },
        update: { voteCount: cand.votes },
        create: {
          categoryId: category.id,
          code: cand.code,
          name: cand.name,
          image: `https://picsum.photos/seed/${cand.code.toLowerCase()}/200/200`,
          voteCount: cand.votes,
        },
      });
    }
    console.log("✅ Sample event and candidates created");

    const ticketEvent = await prisma.event.upsert({
      where: { eventCode: "RAP2024" },
      update: {},
      create: {
        eventCode: "RAP2024",
        title: "Rapperholic Concert 2024",
        description: "The biggest hip-hop concert in Ghana featuring Sarkodie",
        type: "TICKETING",
        status: "LIVE",
        coverImage: "https://picsum.photos/seed/rap/800/600",
        startDate: new Date("2024-12-25"),
        endDate: new Date("2024-12-26"),
        location: "Accra, Ghana",
        venue: "Grand Arena, AICC",
        isPublic: true,
        organizerId: organizer.organizerProfile.id,
        totalRevenue: 250000.0,
      },
    });

    await prisma.ticketType.upsert({
      where: { id: "ticket-regular" },
      update: {},
      create: {
        id: "ticket-regular",
        eventId: ticketEvent.id,
        name: "Regular",
        description: "Standard admission ticket",
        price: 150.0,
        quantity: 5000,
        soldCount: 2500,
        maxPerOrder: 10,
      },
    });

    await prisma.ticketType.upsert({
      where: { id: "ticket-vip" },
      update: {},
      create: {
        id: "ticket-vip",
        eventId: ticketEvent.id,
        name: "VIP",
        description: "VIP access with premium seating",
        price: 500.0,
        quantity: 1000,
        soldCount: 450,
        maxPerOrder: 5,
      },
    });
    console.log("✅ Sample ticketing event created");
  }

  await prisma.systemSetting.upsert({
    where: { key: "platform_name" },
    update: {},
    create: {
      key: "platform_name",
      value: { name: "EaseVote Ghana" },
      description: "Platform display name",
      category: "general",
      isPublic: true,
    },
  });

  await prisma.systemSetting.upsert({
    where: { key: "commission_rate" },
    update: {},
    create: {
      key: "commission_rate",
      value: { rate: 10.0 },
      description: "Default commission rate for organizers (%)",
      category: "financial",
      isPublic: false,
    },
  });

  await prisma.systemSetting.upsert({
    where: { key: "payment_methods" },
    update: {},
    create: {
      key: "payment_methods",
      value: {
        methods: ["mtn_momo", "vodafone_cash", "airteltigo_money", "card"],
      },
      description: "Enabled payment methods",
      category: "payment",
      isPublic: true,
    },
  });
  console.log("✅ System settings created");

  console.log("\n🎉 Seeding completed!");
  console.log("\n📝 Test Accounts:");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("Super Admin: super@easevotegh.com / SuperAdmin@123");
  console.log("Admin:       admin@easevotegh.com / Admin@123");
  console.log("Organizer:   organizer@easevotegh.com / Organizer@123");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  // ... existing user creation logic ... (assuming previous context handles user/profile creation)

  // Find the Organizer to attach events to
  const organizerUser = await prisma.user.findUnique({
    where: { email: "organizer@easevotegh.com" },
    include: { organizerProfile: true },
  });

  if (!organizerUser || !organizerUser.organizerProfile) {
    console.error(
      "Organizer profile not found. Please ensure organizer user is seeded."
    );
    return;
  }

  const organizerId = organizerUser.organizerProfile.id;

  const mockVotingEvents = [
    {
      id: "1",
      title: "Ghana Music Awards 2025",
      eventCode: "GMA25",
      category: "Awards",
      image: "https://picsum.photos/seed/music/800/600",
      date: "Ends in 2 days",
      status: "LIVE",
      organizer: "Charterhouse Ghana",
      description: "The biggest night in Ghana music celebrating excellence.",
      totalVotes: 154200,
      categories: [
        {
          id: "cat_1",
          name: "Artiste of the Year",
          candidates: [
            {
              id: "cand_1",
              name: "Black Sherif",
              image: "https://picsum.photos/seed/blacko/200/200",
              code: "BS",
              votes: 45000,
            },
            {
              id: "cand_2",
              name: "Sarkodie",
              image: "https://picsum.photos/seed/sark/200/200",
              code: "SK",
              votes: 42000,
            },
            {
              id: "cand_stone",
              name: "Stonebwoy",
              image: "https://picsum.photos/seed/stone/200/200",
              code: "ST",
              votes: 40000,
            },
            {
              id: "cand_shatta",
              name: "Shatta Wale",
              image: "https://picsum.photos/seed/shatta/200/200",
              code: "SW",
              votes: 38000,
            },
          ],
        },
        {
          id: "cat_2",
          name: "New Artiste of the Year",
          candidates: [
            {
              id: "cand_3",
              name: "King Paluta",
              image: "https://picsum.photos/seed/paluta/200/200",
              code: "KP",
              votes: 12000,
            },
            {
              id: "cand_olive",
              name: "OliveTheBoy",
              image: "https://picsum.photos/seed/olive/200/200",
              code: "OB",
              votes: 11000,
            },
          ],
        },
        {
          id: "cat_3",
          name: "Reggae/Dancehall Artiste",
          candidates: [
            {
              id: "rd_1",
              name: "Stonebwoy",
              code: "SB-RD",
              votes: 8500,
              image: "https://picsum.photos/seed/stone/200/200",
            },
            {
              id: "rd_2",
              name: "Samini",
              code: "SM-RD",
              votes: 6200,
              image: "https://picsum.photos/seed/samini/200/200",
            },
            {
              id: "rd_3",
              name: "Ras Kuuku",
              code: "RK-RD",
              votes: 4100,
              image: "https://picsum.photos/seed/ras/200/200",
            },
          ],
        },
        {
          id: "cat_4",
          name: "Highlife Artiste of the Year",
          candidates: [
            {
              id: "hl_1",
              name: "Kofi Kinaata",
              code: "KK-HL",
              votes: 9800,
              image: "https://picsum.photos/seed/kinaata/200/200",
            },
            {
              id: "hl_2",
              name: "Kuami Eugene",
              code: "KE-HL",
              votes: 9200,
              image: "https://picsum.photos/seed/eugene/200/200",
            },
            {
              id: "hl_3",
              name: "Akwaboah",
              code: "AK-HL",
              votes: 7500,
              image: "https://picsum.photos/seed/akwaboah/200/200",
            },
          ],
        },
        {
          id: "cat_5",
          name: "Hiplife/Hiphop Artiste",
          candidates: [
            {
              id: "hh_1",
              name: "Sarkodie",
              code: "SK-HH",
              votes: 15400,
              image: "https://picsum.photos/seed/sark/200/200",
            },
            {
              id: "hh_2",
              name: "Black Sherif",
              code: "BS-HH",
              votes: 16200,
              image: "https://picsum.photos/seed/blacko/200/200",
            },
            {
              id: "hh_3",
              name: "Amerado",
              code: "AM-HH",
              votes: 9500,
              image: "https://picsum.photos/seed/amerado/200/200",
            },
          ],
        },
        {
          id: "cat_6",
          name: "Afrobeats Artiste of the Year",
          candidates: [
            {
              id: "ab_1",
              name: "King Promise",
              code: "KP-AB",
              votes: 14500,
              image: "https://picsum.photos/seed/promise/200/200",
            },
            {
              id: "ab_2",
              name: "KiDi",
              code: "KD-AB",
              votes: 11200,
              image: "https://picsum.photos/seed/kidi/200/200",
            },
            {
              id: "ab_3",
              name: "Camidoh",
              code: "CM-AB",
              votes: 8900,
              image: "https://picsum.photos/seed/camidoh/200/200",
            },
          ],
        },
        {
          id: "cat_7",
          name: "Gospel Artiste of the Year",
          candidates: [
            {
              id: "gp_1",
              name: "Diana Hamilton",
              code: "DH-GP",
              votes: 18000,
              image: "https://picsum.photos/seed/diana/200/200",
            },
            {
              id: "gp_2",
              name: "Joe Mettle",
              code: "JM-GP",
              votes: 17500,
              image: "https://picsum.photos/seed/joe/200/200",
            },
            {
              id: "gp_3",
              name: "Piesie Esther",
              code: "PE-GP",
              votes: 16800,
              image: "https://picsum.photos/seed/piesie/200/200",
            },
            {
              id: "gp_4",
              name: "Nacee",
              code: "NC-GP",
              votes: 15900,
              image: "https://picsum.photos/seed/nacee/200/200",
            },
          ],
        },
        {
          id: "cat_8",
          name: "Female Vocalist of the Year",
          candidates: [
            {
              id: "fv_1",
              name: "Adina Thembi",
              code: "AD-FV",
              votes: 5600,
              image: "https://picsum.photos/seed/adina/200/200",
            },
            {
              id: "fv_2",
              name: "Gyakie",
              code: "GK-FV",
              votes: 7200,
              image: "https://picsum.photos/seed/gyakie/200/200",
            },
            {
              id: "fv_3",
              name: "Sista Afia",
              code: "SA-FV",
              votes: 4300,
              image: "https://picsum.photos/seed/sista/200/200",
            },
          ],
        },
        {
          id: "cat_9",
          name: "Male Vocalist of the Year",
          candidates: [
            {
              id: "mv_1",
              name: "Kyei Mensah",
              code: "KM-MV",
              votes: 3400,
              image: "https://picsum.photos/seed/kyei/200/200",
            },
            {
              id: "mv_2",
              name: "Perez Musik",
              code: "PM-MV",
              votes: 4100,
              image: "https://picsum.photos/seed/perez/200/200",
            },
            {
              id: "mv_3",
              name: "Camidoh",
              code: "CM-MV",
              votes: 5800,
              image: "https://picsum.photos/seed/camidoh/200/200",
            },
          ],
        },
        {
          id: "cat_10",
          name: "Best Rapper of the Year",
          candidates: [
            {
              id: "rp_1",
              name: "Strongman",
              code: "SM-RP",
              votes: 8900,
              image: "https://picsum.photos/seed/strong/200/200",
            },
            {
              id: "rp_2",
              name: "Medikal",
              code: "MD-RP",
              votes: 9400,
              image: "https://picsum.photos/seed/medikal/200/200",
            },
            {
              id: "rp_3",
              name: "Eno Barony",
              code: "EB-RP",
              votes: 7600,
              image: "https://picsum.photos/seed/eno/200/200",
            },
            {
              id: "rp_4",
              name: "Teephlow",
              code: "TP-RP",
              votes: 5200,
              image: "https://picsum.photos/seed/tee/200/200",
            },
          ],
        },
        {
          id: "cat_11",
          name: "Songwriter of the Year",
          candidates: [
            {
              id: "sw_1",
              name: "Kofi Kinaata - Effiakuma",
              code: "KK-SW",
              votes: 4500,
              image: "https://picsum.photos/seed/kinaata/200/200",
            },
            {
              id: "sw_2",
              name: "Piesie Esther - Waye Me Yie",
              code: "PE-SW",
              votes: 5500,
              image: "https://picsum.photos/seed/piesie/200/200",
            },
            {
              id: "sw_3",
              name: "Black Sherif - Oh Paradise",
              code: "BS-SW",
              votes: 6100,
              image: "https://picsum.photos/seed/blacko/200/200",
            },
          ],
        },
        {
          id: "cat_12",
          name: "Best Collaboration",
          candidates: [
            {
              id: "col_1",
              name: "Liquor - Mawuli Younggod ft. Medikal",
              code: "LQ-CL",
              votes: 3200,
              image: "https://picsum.photos/seed/mawuli/200/200",
            },
            {
              id: "col_2",
              name: "Terminator - King Promise ft. Youg Jonn",
              code: "TM-CL",
              votes: 12000,
              image: "https://picsum.photos/seed/promise/200/200",
            },
            {
              id: "col_3",
              name: "Otan - Sarkodie",
              code: "OT-CL",
              votes: 8700,
              image: "https://picsum.photos/seed/sark/200/200",
            },
          ],
        },
        {
          id: "cat_13",
          name: "Best Music Video",
          candidates: [
            {
              id: "vid_1",
              name: "Oil in my Head - Black Sherif",
              code: "OH-VD",
              votes: 9800,
              image: "https://picsum.photos/seed/blacko/200/200",
            },
            {
              id: "vid_2",
              name: "Cryptocurrency - Kuami Eugene",
              code: "CY-VD",
              votes: 7600,
              image: "https://picsum.photos/seed/eugene/200/200",
            },
            {
              id: "vid_3",
              name: "10AM - Strongman",
              code: "TM-VD",
              votes: 5400,
              image: "https://picsum.photos/seed/strong/200/200",
            },
          ],
        },
        {
          id: "cat_14",
          name: "Album of the Year",
          candidates: [
            {
              id: "alb_1",
              name: "The Villain I Never Was - Black Sherif",
              code: "VN-AL",
              votes: 15600,
              image: "https://picsum.photos/seed/blacko/200/200",
            },
            {
              id: "alb_2",
              name: "Jamz - Sarkodie",
              code: "JZ-AL",
              votes: 14200,
              image: "https://picsum.photos/seed/sark/200/200",
            },
            {
              id: "alb_3",
              name: "5th Dimension - Stonebwoy",
              code: "FD-AL",
              votes: 13800,
              image: "https://picsum.photos/seed/stone/200/200",
            },
          ],
        },
        {
          id: "cat_15",
          name: "EP of the Year",
          candidates: [
            {
              id: "ep_1",
              name: "Truths & Rumors - Amerado",
              code: "TR-EP",
              votes: 4200,
              image: "https://picsum.photos/seed/amerado/200/200",
            },
            {
              id: "ep_2",
              name: "Mood Swings - Edem",
              code: "MS-EP",
              votes: 3100,
              image: "https://picsum.photos/seed/edem/200/200",
            },
            {
              id: "ep_3",
              name: "Avana - Gyakie",
              code: "AV-EP",
              votes: 6500,
              image: "https://picsum.photos/seed/gyakie/200/200",
            },
          ],
        },
        {
          id: "cat_16",
          name: "Record of the Year",
          candidates: [
            {
              id: "rec_1",
              name: "Far Away - Sarkodie",
              code: "FA-RC",
              votes: 5300,
              image: "https://picsum.photos/seed/sark/200/200",
            },
            {
              id: "rec_2",
              name: "Maniod - Stonebwoy",
              code: "MN-RC",
              votes: 5100,
              image: "https://picsum.photos/seed/stone/200/200",
            },
            {
              id: "rec_3",
              name: "Soja - Black Sherif",
              code: "SJ-RC",
              votes: 5900,
              image: "https://picsum.photos/seed/blacko/200/200",
            },
          ],
        },
        {
          id: "cat_17",
          name: "Audio Engineer of the Year",
          candidates: [
            {
              id: "ae_1",
              name: "Possigee",
              code: "PS-AE",
              votes: 2000,
              image: "https://picsum.photos/seed/possigee/200/200",
            },
            {
              id: "ae_2",
              name: "MOG Beatz",
              code: "MG-AE",
              votes: 2500,
              image: "https://picsum.photos/seed/mog/200/200",
            },
            {
              id: "ae_3",
              name: "Streetbeatz",
              code: "SB-AE",
              votes: 1800,
              image: "https://picsum.photos/seed/street/200/200",
            },
          ],
        },
        {
          id: "cat_18",
          name: "Producer of the Year",
          candidates: [
            {
              id: "pd_1",
              name: "MOG Beatz",
              code: "MG-PD",
              votes: 6700,
              image: "https://picsum.photos/seed/mog/200/200",
            },
            {
              id: "pd_2",
              name: "Samsney",
              code: "SM-PD",
              votes: 5400,
              image: "https://picsum.photos/seed/samsney/200/200",
            },
            {
              id: "pd_3",
              name: "Atown TSB",
              code: "AT-PD",
              votes: 4900,
              image: "https://picsum.photos/seed/atown/200/200",
            },
          ],
        },
        {
          id: "cat_19",
          name: "Best Group",
          candidates: [
            {
              id: "bg_1",
              name: "R2Bees",
              code: "RB-BG",
              votes: 8500,
              image: "https://picsum.photos/seed/r2bees/200/200",
            },
            {
              id: "bg_2",
              name: "Keche",
              code: "KC-BG",
              votes: 6200,
              image: "https://picsum.photos/seed/keche/200/200",
            },
            {
              id: "bg_3",
              name: "DopeNation",
              code: "DN-BG",
              votes: 7100,
              image: "https://picsum.photos/seed/dope/200/200",
            },
          ],
        },
        {
          id: "cat_20",
          name: "African Artiste of the Year",
          candidates: [
            {
              id: "aa_1",
              name: "Burna Boy",
              code: "BB-AA",
              votes: 25000,
              image: "https://picsum.photos/seed/burna/200/200",
            },
            {
              id: "aa_2",
              name: "Davido",
              code: "DV-AA",
              votes: 24500,
              image: "https://picsum.photos/seed/davido/200/200",
            },
            {
              id: "aa_3",
              name: "Rema",
              code: "RM-AA",
              votes: 21000,
              image: "https://picsum.photos/seed/rema/200/200",
            },
            {
              id: "aa_4",
              name: "Asake",
              code: "AS-AA",
              votes: 20500,
              image: "https://picsum.photos/seed/asake/200/200",
            },
          ],
        },
        {
          id: "cat_21",
          name: "Unsung Artiste",
          candidates: [
            {
              id: "us_1",
              name: "Lali X Lola",
              code: "LX-US",
              votes: 2100,
              image: "https://picsum.photos/seed/lali/200/200",
            },
            {
              id: "us_2",
              name: "Kweku Boateng",
              code: "KB-US",
              votes: 1500,
              image: "https://picsum.photos/seed/kweku/200/200",
            },
            {
              id: "us_3",
              name: "Maya Blu",
              code: "MB-US",
              votes: 2800,
              image: "https://picsum.photos/seed/maya/200/200",
            },
          ],
        },
      ],
    },
    {
      id: "2",
      title: "Legon SRC Election 2024",
      eventCode: "UGSRC",
      category: "School",
      image: "https://picsum.photos/seed/legon/800/600",
      date: "Ends at 5 PM",
      status: "LIVE",
      organizer: "University of Ghana Electoral Commission",
      description:
        "Deciding the next SRC President for the 2024/2025 academic year.",
      totalVotes: 12500,
      categories: [
        {
          id: "cat_sec",
          name: "General Secretary",
          candidates: [
            {
              id: "cand_sec_1",
              name: "Adwoa Smart",
              image: "https://picsum.photos/seed/adwoa/200/200",
              code: "AS",
              votes: 5000,
            },
          ],
        },
      ],
    },
    {
      id: "3",
      title: "Miss Ghana 2025",
      eventCode: "MSGHA",
      category: "Pageantry",
      image: "https://picsum.photos/seed/pageant/800/600",
      date: "Starts in 5 days",
      status: "Upcoming",
      organizer: "Exclusive Events Ghana",
      description:
        "Who wears the crown next? Vote for your favorite beauty queen.",
      totalVotes: 0,
      categories: [
        {
          id: "cat_miss_1",
          name: "Viewer's Choice",
          candidates: [
            {
              id: "cand_miss_1",
              name: "Naa Okailey",
              image: "https://picsum.photos/seed/naa/200/200",
              code: "NO",
              votes: 0,
            },
            {
              id: "cand_miss_2",
              name: "Afia Pokua",
              image: "https://picsum.photos/seed/afia/200/200",
              code: "AP",
              votes: 0,
            },
          ],
        },
      ],
    },
    {
      id: "4",
      title: "GPL Player of the Month",
      eventCode: "GPL-OCT",
      category: "Sports",
      image: "https://picsum.photos/seed/football/800/600",
      date: "Ends in 24 hours",
      status: "Live",
      organizer: "Ghana Football Association",
      description:
        "Vote for the outstanding player in the Ghana Premier League for October.",
      totalVotes: 8900,
      categories: [
        {
          id: "cat_gpl_1",
          name: "Best Forward",
          candidates: [
            {
              id: "cand_gpl_1",
              name: "Steven Mukwala",
              image: "https://picsum.photos/seed/mukwala/200/200",
              code: "SM",
              votes: 3200,
            },
            {
              id: "cand_gpl_2",
              name: "Richmond Lamptey",
              image: "https://picsum.photos/seed/lamptey/200/200",
              code: "RL",
              votes: 2800,
            },
          ],
        },
      ],
    },
    {
      id: "5",
      title: "Ghana Startup Awards",
      eventCode: "GSA25",
      category: "Tech",
      image: "https://picsum.photos/seed/tech/800/600",
      date: "Ended yesterday",
      status: "Ended",
      organizer: "Ghana Tech Network",
      description: "Recognizing the most innovative startups in the ecosystem.",
      totalVotes: 45000,
      categories: [
        {
          id: "cat_tech_1",
          name: "Fintech of the Year",
          candidates: [
            {
              id: "cand_tech_1",
              name: "Zeepay",
              image: "https://picsum.photos/seed/zeepay/200/200",
              code: "ZP",
              votes: 15000,
            },
            {
              id: "cand_tech_2",
              name: "Hubtel",
              image: "https://picsum.photos/seed/hubtel/200/200",
              code: "HB",
              votes: 14500,
            },
          ],
        },
      ],
    },
    {
      id: "6",
      title: "KNUST SRC Elections",
      eventCode: "KNUST-SRC",
      category: "School",
      image: "https://picsum.photos/seed/knust/800/600",
      date: "Live Now",
      status: "Live",
      organizer: "KNUST Electoral Commission",
      description: "Vote for your leaders. Teknocrat, your voice matters!",
      totalVotes: 22000,
      categories: [
        {
          id: "cat_pres_knust",
          name: "SRC President",
          candidates: [
            {
              id: "cand_knust_1",
              name: "Master Oten",
              image: "https://picsum.photos/seed/oten/200/200",
              code: "MO",
              votes: 8000,
            },
            {
              id: "cand_knust_2",
              name: "Yvonne Nti",
              image: "https://picsum.photos/seed/yvonne/200/200",
              code: "YN",
              votes: 7500,
            },
          ],
        },
      ],
    },
    {
      id: "7",
      title: "National Gospel Excellence Awards",
      eventCode: "NGEA",
      category: "Awards",
      image: "https://picsum.photos/seed/gospel/800/600",
      date: "Ends in 1 week",
      status: "Live",
      organizer: "Christian Council",
      description: "Honoring the best in ministry and gospel music.",
      totalVotes: 67000,
      categories: [
        {
          id: "cat_gospel_1",
          name: "Song of the Year",
          candidates: [
            {
              id: "cand_gospel_1",
              name: "Diana Hamilton",
              image: "https://picsum.photos/seed/diana/200/200",
              code: "DH",
              votes: 30000,
            },
            {
              id: "cand_gospel_2",
              name: "Joe Mettle",
              image: "https://picsum.photos/seed/joe/200/200",
              code: "JM",
              votes: 28000,
            },
          ],
        },
      ],
    },
    {
      id: "8",
      title: "Accra Food Festival: Best Vendor",
      eventCode: "AFF-25",
      category: "Lifestyle",
      image: "https://picsum.photos/seed/food/800/600",
      date: "Starts Tomorrow",
      status: "Upcoming",
      organizer: "Accra Expat Life",
      description:
        "Who makes the best Jollof in the city? Come taste and vote!",
      totalVotes: 0,
      categories: [
        {
          id: "cat_food_1",
          name: "Best Jollof Vendor",
          candidates: [
            {
              id: "cand_food_1",
              name: "Menufinder Jollof",
              image: "https://picsum.photos/seed/menu/200/200",
              code: "MJ",
              votes: 0,
            },
            {
              id: "cand_food_2",
              name: "Sister Akos Special",
              image: "https://picsum.photos/seed/akos/200/200",
              code: "SA",
              votes: 0,
            },
          ],
        },
      ],
    },
    {
      id: "9",
      title: "NSMQ Fan Favourite 2025",
      eventCode: "NSMQ-FAN",
      category: "Education",
      image: "https://picsum.photos/seed/science/800/600",
      date: "Live",
      status: "Live",
      organizer: "Primetime Limited",
      description:
        "Vote for the most spirited school in this year's competition.",
      totalVotes: 340000,
      categories: [
        {
          id: "cat_nsmq_1",
          name: "School of the Year",
          candidates: [
            {
              id: "cand_nsmq_1",
              name: "PRESEC Legon",
              image: "https://picsum.photos/seed/presec/200/200",
              code: "PS",
              votes: 120000,
            },
            {
              id: "cand_nsmq_2",
              name: "Prempeh College",
              image: "https://picsum.photos/seed/prempeh/200/200",
              code: "PC",
              votes: 110000,
            },
            {
              id: "cand_nsmq_3",
              name: "Adisadel College",
              image: "https://picsum.photos/seed/adisco/200/200",
              code: "AC",
              votes: 95000,
            },
          ],
        },
      ],
    },
    {
      id: "10",
      title: "CIMG Marketing Awards",
      eventCode: "CIMG-24",
      category: "Corporate",
      image: "https://picsum.photos/seed/corporate/800/600",
      date: "Ended",
      status: "Ended",
      organizer: "Chartered Institute of Marketing Ghana",
      description: "Celebrating marketing excellence in the corporate world.",
      totalVotes: 5000,
      categories: [
        {
          id: "cat_cimg_1",
          name: "Marketing Woman of the Year",
          candidates: [
            {
              id: "cand_cimg_1",
              name: "Patricia Obo-Nai",
              image: "https://picsum.photos/seed/patricia/200/200",
              code: "PN",
              votes: 2100,
            },
            {
              id: "cand_cimg_2",
              name: "Abena Osei-Poku",
              image: "https://picsum.photos/seed/abena/200/200",
              code: "AO",
              votes: 1900,
            },
          ],
        },
      ],
    },
  ];

  // Helper to parse dates
  const getDates = (status: string) => {
    const now = new Date();
    let start = new Date(now);
    let end = new Date(now);

    if (status === "LIVE") {
      start.setDate(now.getDate() - 2);
      end.setDate(now.getDate() + 5);
    } else if (status === "ENDED") {
      start.setDate(now.getDate() - 10);
      end.setDate(now.getDate() - 1);
    } else {
      // Draft/Upcoming
      start.setDate(now.getDate() + 2);
      end.setDate(now.getDate() + 7);
    }
    return { start, end };
  };

  console.log("🌱 Seeding Voting Events...");

  for (const evt of mockVotingEvents) {
    const { start, end } = getDates(evt.status);

    // Convert status string to Enum
    let statusEnum = "DRAFT";
    if (evt.status.toUpperCase() === "LIVE") statusEnum = "LIVE";
    if (evt.status.toUpperCase() === "ENDED") statusEnum = "ENDED";
    if (evt.status.toUpperCase() === "UPCOMING") statusEnum = "PENDING_REVIEW";

    await prisma.event.upsert({
      where: { eventCode: evt.eventCode },
      update: {
        title: evt.title,
        description: evt.description,
        coverImage: evt.image,
        startDate: start,
        endDate: end,
        status: statusEnum as any,
        organizerId: organizerId,
      },
      create: {
        eventCode: evt.eventCode,
        title: evt.title,
        description: evt.description,
        type: "VOTING",
        status: statusEnum as any,
        startDate: start,
        endDate: end,
        coverImage: evt.image,
        organizerId: organizerId,
        votePrice: 5.0, // Default price
        metadata: { category: evt.category }, // Store the 'Awards', 'School' category in metadata
        categories: {
          create: evt.categories.map((cat, idx) => ({
            name: cat.name,
            sortOrder: idx,
            candidates: {
              create: cat.candidates.map((cand, cIdx) => ({
                name: cand.name,
                code: cand.code, // Assign code
                image: cand.image,
                voteCount: cand.votes || 0,
                sortOrder: cIdx,
              })),
            },
          })),
        },
      },
    });
  }

  console.log("✅ Voting Events seeded.");

  const count = await prisma.event.count({
    where: { type: "VOTING" },
  });
  console.log(`\n***************************************`);
  console.log(`CURRENT VOTING EVENTS COUNT: ${count}`);
  console.log(`***************************************\n`);
}

main()
  .catch((e) => {
    console.error("❌ Seeding failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
