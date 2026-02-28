export interface StateData {
  name: string;
  abbr: string;
  trending: {
    category: string;
    icon: string;
    items: string[];
  }[];
  activeShow: {
    title: string;
    thumbnail: string;
    videoUrl: string;
    injectedBrand: string;
    brandLogo: string;
    viewers: string;
  };
  hotScore: number; // 0-100 for heat map coloring
}

export const stateDataMap: Record<string, StateData> = {
  California: {
    name: "California",
    abbr: "CA",
    trending: [
      { category: "Tech", icon: "🤖", items: ["OpenAI GPT-5", "Apple Vision Pro 2", "Tesla Optimus"] },
      { category: "Shows", icon: "🎬", items: ["Stranger Things S5", "The Bear S4", "Squid Game S3"] },
      { category: "Sports", icon: "⚽", items: ["Lakers Playoffs", "49ers Draft", "LA Galaxy"] },
    ],
    activeShow: {
      title: "Stranger Things S5",
      thumbnail: "https://images.unsplash.com/photo-1626814026160-2237a95fc5a0?w=400&h=225&fit=crop",
      videoUrl: "https://stream-inject-videos-demo.s3.us-east-1.amazonaws.com/1.mov?X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Credential=AKIA2TAGAXSZ743IZ54N%2F20260228%2Fus-east-1%2Fs3%2Faws4_request&X-Amz-Date=20260228T005025Z&X-Amz-Expires=604800&X-Amz-SignedHeaders=host&X-Amz-Signature=fc37f227ab27d96c515bb9b910b2b203df259911138c519f928fd219e87a592c",
      injectedBrand: "OpenAI",
      brandLogo: "https://upload.wikimedia.org/wikipedia/commons/thumb/4/4d/OpenAI_Logo.svg/120px-OpenAI_Logo.svg.png",
      viewers: "2.4M",
    },
    hotScore: 95,
  },
  Texas: {
    name: "Texas",
    abbr: "TX",
    trending: [
      { category: "Tech", icon: "🚀", items: ["SpaceX Starship", "Dell AI Servers", "Texas Instruments"] },
      { category: "Shows", icon: "🎬", items: ["Yellowstone S6", "The Last of Us S3", "True Detective S5"] },
      { category: "Sports", icon: "🏈", items: ["Cowboys Preseason", "Astros World Series", "Mavs Playoffs"] },
    ],
    activeShow: {
      title: "Yellowstone S6",
      thumbnail: "https://images.unsplash.com/photo-1500534314209-a25ddb2bd429?w=400&h=225&fit=crop",
      videoUrl: "",
      injectedBrand: "SpaceX",
      brandLogo: "https://upload.wikimedia.org/wikipedia/commons/thumb/2/2e/SpaceX_logo_black.svg/120px-SpaceX_logo_black.svg.png",
      viewers: "1.8M",
    },
    hotScore: 88,
  },
  "New York": {
    name: "New York",
    abbr: "NY",
    trending: [
      { category: "Tech", icon: "💰", items: ["Bloomberg Terminal AI", "Nasdaq AI Trading", "IBM Quantum"] },
      { category: "Shows", icon: "🎬", items: ["Succession Reboot", "Law & Order S25", "Seinfeld Revival"] },
      { category: "Sports", icon: "🏀", items: ["Knicks Playoffs", "Yankees World Series", "Giants Draft"] },
    ],
    activeShow: {
      title: "Succession Reboot",
      thumbnail: "https://images.unsplash.com/photo-1480714378408-67cf0d13bc1b?w=400&h=225&fit=crop",
      videoUrl: "https://stream-inject-videos-demo.s3.us-east-1.amazonaws.com/2.mov?X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Credential=AKIA2TAGAXSZ743IZ54N%2F20260228%2Fus-east-1%2Fs3%2Faws4_request&X-Amz-Date=20260228T005026Z&X-Amz-Expires=604800&X-Amz-SignedHeaders=host&X-Amz-Signature=632fb3f7ffebef54f0161501917053c61c30bcf3bd415b30254de283afa666ce",
      injectedBrand: "Bloomberg",
      brandLogo: "https://upload.wikimedia.org/wikipedia/commons/thumb/5/5d/New_Bloomberg_Logo.svg/120px-New_Bloomberg_Logo.svg.png",
      viewers: "3.1M",
    },
    hotScore: 92,
  },
  Florida: {
    name: "Florida",
    abbr: "FL",
    trending: [
      { category: "Tech", icon: "🌴", items: ["Magic Leap 3", "Jabil AI Manufacturing", "Chewy AI"] },
      { category: "Shows", icon: "🎬", items: ["Dexter Resurrection", "Burn Notice Revival", "CSI Miami Return"] },
      { category: "Sports", icon: "🏈", items: ["Heat Playoffs", "Dolphins Season", "Inter Miami"] },
    ],
    activeShow: {
      title: "Dexter Resurrection",
      thumbnail: "https://images.unsplash.com/photo-1533106497176-45ae19e68ba2?w=400&h=225&fit=crop",
      videoUrl: "",
      injectedBrand: "Magic Leap",
      brandLogo: "",
      viewers: "1.5M",
    },
    hotScore: 78,
  },
  Illinois: {
    name: "Illinois",
    abbr: "IL",
    trending: [
      { category: "Tech", icon: "🏙️", items: ["Motorola Edge AI", "Caterpillar Autonomous", "Grubhub AI"] },
      { category: "Shows", icon: "🎬", items: ["Chicago Fire S14", "The Bear S4", "Shameless Revival"] },
      { category: "Sports", icon: "🏀", items: ["Bulls Rebuild", "Bears Season", "Cubs Playoffs"] },
    ],
    activeShow: {
      title: "The Bear S4",
      thumbnail: "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=400&h=225&fit=crop",
      videoUrl: "",
      injectedBrand: "Grubhub",
      brandLogo: "",
      viewers: "1.2M",
    },
    hotScore: 72,
  },
  Washington: {
    name: "Washington",
    abbr: "WA",
    trending: [
      { category: "Tech", icon: "☁️", items: ["Microsoft Copilot", "Amazon AGI", "Boeing AI Pilots"] },
      { category: "Shows", icon: "🎬", items: ["Grey's Anatomy S22", "Twin Peaks Revival", "Frasier S3"] },
      { category: "Sports", icon: "⚾", items: ["Seahawks Season", "Mariners Playoffs", "Kraken Hockey"] },
    ],
    activeShow: {
      title: "Grey's Anatomy S22",
      thumbnail: "https://images.unsplash.com/photo-1519681393784-d120267933ba?w=400&h=225&fit=crop",
      videoUrl: "",
      injectedBrand: "Microsoft",
      brandLogo: "https://upload.wikimedia.org/wikipedia/commons/thumb/4/44/Microsoft_logo.svg/120px-Microsoft_logo.svg.png",
      viewers: "1.9M",
    },
    hotScore: 85,
  },
  Georgia: {
    name: "Georgia",
    abbr: "GA",
    trending: [
      { category: "Tech", icon: "🎮", items: ["NCR Voyix AI", "Honeywell Quantum", "SalesLoft AI"] },
      { category: "Shows", icon: "🎬", items: ["Walking Dead Universe", "Atlanta S5", "Ozark Prequel"] },
      { category: "Sports", icon: "🏈", items: ["Falcons Season", "Braves World Series", "Hawks Rebuild"] },
    ],
    activeShow: {
      title: "Walking Dead Universe",
      thumbnail: "https://images.unsplash.com/photo-1509281373149-e957c6296406?w=400&h=225&fit=crop",
      videoUrl: "",
      injectedBrand: "Honeywell",
      brandLogo: "",
      viewers: "1.1M",
    },
    hotScore: 68,
  },
  Pennsylvania: {
    name: "Pennsylvania",
    abbr: "PA",
    trending: [
      { category: "Tech", icon: "⚙️", items: ["Comcast AI TV", "SAP America AI", "Bentley Systems"] },
      { category: "Shows", icon: "🎬", items: ["It's Always Sunny S17", "Mare of Easttown S2", "Rocky Legacy"] },
      { category: "Sports", icon: "🏈", items: ["Eagles Super Bowl", "76ers Playoffs", "Steelers Draft"] },
    ],
    activeShow: {
      title: "It's Always Sunny S17",
      thumbnail: "https://images.unsplash.com/photo-1569982175971-d92b01cf8694?w=400&h=225&fit=crop",
      videoUrl: "",
      injectedBrand: "Comcast",
      brandLogo: "",
      viewers: "980K",
    },
    hotScore: 65,
  },
  Ohio: {
    name: "Ohio",
    abbr: "OH",
    trending: [
      { category: "Tech", icon: "🏭", items: ["P&G Smart Home", "Kroger AI Checkout", "GE Aviation AI"] },
      { category: "Shows", icon: "🎬", items: ["Glee Revival", "A Christmas Story Sequel", "Riverdale Reboot"] },
      { category: "Sports", icon: "🏈", items: ["Bengals Season", "Cavaliers Playoffs", "Guardians Run"] },
    ],
    activeShow: {
      title: "Glee Revival",
      thumbnail: "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400&h=225&fit=crop",
      videoUrl: "",
      injectedBrand: "P&G",
      brandLogo: "",
      viewers: "720K",
    },
    hotScore: 55,
  },
  Michigan: {
    name: "Michigan",
    abbr: "MI",
    trending: [
      { category: "Tech", icon: "🚗", items: ["Ford BlueCruise AI", "GM Cruise", "Rivian Autonomy"] },
      { category: "Shows", icon: "🎬", items: ["8 Mile Series", "Robocop Reboot", "Detroit 1-8-7 Revival"] },
      { category: "Sports", icon: "🏈", items: ["Lions Dynasty", "Pistons Rebuild", "Red Wings Hockey"] },
    ],
    activeShow: {
      title: "8 Mile Series",
      thumbnail: "https://images.unsplash.com/photo-1558618666-fcd25c85f82e?w=400&h=225&fit=crop",
      videoUrl: "",
      injectedBrand: "Ford",
      brandLogo: "https://upload.wikimedia.org/wikipedia/commons/thumb/1/18/Ford_logo_flat.svg/120px-Ford_logo_flat.svg.png",
      viewers: "890K",
    },
    hotScore: 62,
  },
  "North Carolina": {
    name: "North Carolina",
    abbr: "NC",
    trending: [
      { category: "Tech", icon: "🔬", items: ["Epic Games Unreal 6", "Red Hat AI Cloud", "SAS Analytics"] },
      { category: "Shows", icon: "🎬", items: ["Outer Banks S5", "One Tree Hill Revival", "Homeland Return"] },
      { category: "Sports", icon: "🏀", items: ["Panthers Season", "Hornets Build", "Hurricanes Hockey"] },
    ],
    activeShow: {
      title: "Outer Banks S5",
      thumbnail: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=400&h=225&fit=crop",
      videoUrl: "",
      injectedBrand: "Epic Games",
      brandLogo: "",
      viewers: "1.3M",
    },
    hotScore: 70,
  },
  Colorado: {
    name: "Colorado",
    abbr: "CO",
    trending: [
      { category: "Tech", icon: "🏔️", items: ["Palantir AIP", "Arrow Electronics AI", "Boom Supersonic"] },
      { category: "Shows", icon: "🎬", items: ["South Park S30", "Yellowjackets S4", "Expeditionary Force"] },
      { category: "Sports", icon: "🏈", items: ["Broncos Season", "Nuggets Repeat", "Avalanche Cup"] },
    ],
    activeShow: {
      title: "South Park S30",
      thumbnail: "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=400&h=225&fit=crop",
      videoUrl: "",
      injectedBrand: "Palantir",
      brandLogo: "",
      viewers: "1.6M",
    },
    hotScore: 74,
  },
  Massachusetts: {
    name: "Massachusetts",
    abbr: "MA",
    trending: [
      { category: "Tech", icon: "🎓", items: ["MIT AGI Lab", "Moderna mRNA AI", "HubSpot AI CRM"] },
      { category: "Shows", icon: "🎬", items: ["Good Will Hunting 2", "Boston Legal Revival", "The Departed Series"] },
      { category: "Sports", icon: "🏈", items: ["Celtics Dynasty", "Patriots Rebuild", "Red Sox Run"] },
    ],
    activeShow: {
      title: "Boston Legal Revival",
      thumbnail: "https://images.unsplash.com/photo-1501979376754-1d09360be3e4?w=400&h=225&fit=crop",
      videoUrl: "",
      injectedBrand: "HubSpot",
      brandLogo: "",
      viewers: "1.0M",
    },
    hotScore: 80,
  },
  Arizona: {
    name: "Arizona",
    abbr: "AZ",
    trending: [
      { category: "Tech", icon: "☀️", items: ["TSMC Phoenix Fab", "Microchip AI", "Nikola Motors"] },
      { category: "Shows", icon: "🎬", items: ["Breaking Bad Prequel", "Westworld Revival", "Arizona Sunshine"] },
      { category: "Sports", icon: "🏈", items: ["Cardinals Season", "Suns Playoffs", "Diamondbacks Run"] },
    ],
    activeShow: {
      title: "Breaking Bad Prequel",
      thumbnail: "https://images.unsplash.com/photo-1518173946687-a1e5e810e52b?w=400&h=225&fit=crop",
      videoUrl: "",
      injectedBrand: "TSMC",
      brandLogo: "",
      viewers: "2.1M",
    },
    hotScore: 82,
  },
  Nevada: {
    name: "Nevada",
    abbr: "NV",
    trending: [
      { category: "Tech", icon: "🎰", items: ["Switch Data Centers AI", "Caesars AI Experience", "Tesla Gigafactory"] },
      { category: "Shows", icon: "🎬", items: ["CSI Vegas S4", "Ocean's 14", "Fallout S3"] },
      { category: "Sports", icon: "🏈", items: ["Raiders Season", "Golden Knights Cup", "Aces WNBA"] },
    ],
    activeShow: {
      title: "Fallout S3",
      thumbnail: "https://images.unsplash.com/photo-1581351721010-8cf859cb14a4?w=400&h=225&fit=crop",
      videoUrl: "",
      injectedBrand: "Tesla",
      brandLogo: "https://upload.wikimedia.org/wikipedia/commons/thumb/b/bd/Tesla_Motors.svg/60px-Tesla_Motors.svg.png",
      viewers: "1.7M",
    },
    hotScore: 76,
  },
  Oregon: {
    name: "Oregon",
    abbr: "OR",
    trending: [
      { category: "Tech", icon: "👟", items: ["Nike AI Design", "Intel Foundry AI", "Puppet Automation"] },
      { category: "Shows", icon: "🎬", items: ["Portlandia Revival", "Grimm Reboot", "Wild Wild Country S2"] },
      { category: "Sports", icon: "⚽", items: ["Trail Blazers Build", "Timbers MLS", "Ducks Football"] },
    ],
    activeShow: {
      title: "Portlandia Revival",
      thumbnail: "https://images.unsplash.com/photo-1501594907352-04cda38ebc29?w=400&h=225&fit=crop",
      videoUrl: "",
      injectedBrand: "Nike",
      brandLogo: "https://upload.wikimedia.org/wikipedia/commons/thumb/a/a6/Logo_NIKE.svg/120px-Logo_NIKE.svg.png",
      viewers: "650K",
    },
    hotScore: 58,
  },
  Minnesota: {
    name: "Minnesota",
    abbr: "MN",
    trending: [
      { category: "Tech", icon: "🏥", items: ["UnitedHealth AI", "3M Innovation AI", "Medtronic Robotics"] },
      { category: "Shows", icon: "🎬", items: ["Fargo S6", "The Mighty Ducks S3", "Purple Rain Musical"] },
      { category: "Sports", icon: "🏈", items: ["Vikings Season", "Timberwolves Run", "Wild Hockey"] },
    ],
    activeShow: {
      title: "Fargo S6",
      thumbnail: "https://images.unsplash.com/photo-1478760329108-5c3ed9d495a0?w=400&h=225&fit=crop",
      videoUrl: "",
      injectedBrand: "3M",
      brandLogo: "",
      viewers: "1.4M",
    },
    hotScore: 66,
  },
  Tennessee: {
    name: "Tennessee",
    abbr: "TN",
    trending: [
      { category: "Tech", icon: "🎵", items: ["Oracle Health AI", "FedEx Autonomous", "AllianceBernstein AI"] },
      { category: "Shows", icon: "🎬", items: ["Nashville Revival", "Yellowstone Spinoff", "Memphis Beat Return"] },
      { category: "Sports", icon: "🏈", items: ["Titans Season", "Grizzlies Playoffs", "Predators Hockey"] },
    ],
    activeShow: {
      title: "Nashville Revival",
      thumbnail: "https://images.unsplash.com/photo-1545231027-637d2f6210f8?w=400&h=225&fit=crop",
      videoUrl: "",
      injectedBrand: "FedEx",
      brandLogo: "",
      viewers: "780K",
    },
    hotScore: 60,
  },
  Virginia: {
    name: "Virginia",
    abbr: "VA",
    trending: [
      { category: "Tech", icon: "🛡️", items: ["AWS GovCloud AI", "Northrop Grumman AI", "Capital One ML"] },
      { category: "Shows", icon: "🎬", items: ["Jack Ryan S5", "NCIS S23", "Turn Revival"] },
      { category: "Sports", icon: "🏈", items: ["Commanders Season", "UVA Football", "DC United"] },
    ],
    activeShow: {
      title: "Jack Ryan S5",
      thumbnail: "https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=400&h=225&fit=crop",
      videoUrl: "",
      injectedBrand: "AWS",
      brandLogo: "https://upload.wikimedia.org/wikipedia/commons/thumb/9/93/Amazon_Web_Services_Logo.svg/120px-Amazon_Web_Services_Logo.svg.png",
      viewers: "1.5M",
    },
    hotScore: 77,
  },
};

// Default data for states not explicitly defined
export const defaultStateData: Omit<StateData, 'name' | 'abbr'> = {
  trending: [
    { category: "Tech", icon: "💡", items: ["AI Assistants", "Smart Home", "5G Expansion"] },
    { category: "Shows", icon: "🎬", items: ["Stranger Things S5", "Wednesday S2", "The Witcher S4"] },
    { category: "Sports", icon: "🏈", items: ["NFL Season", "NBA Playoffs", "MLB World Series"] },
  ],
  activeShow: {
    title: "Stranger Things S5",
    thumbnail: "https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=400&h=225&fit=crop",
    videoUrl: "",
    injectedBrand: "Netflix",
    brandLogo: "",
    viewers: "500K",
  },
  hotScore: 40,
};

export function getStateData(stateName: string): StateData {
  if (stateDataMap[stateName]) return stateDataMap[stateName];
  return {
    name: stateName,
    abbr: stateName.substring(0, 2).toUpperCase(),
    ...defaultStateData,
    hotScore: Math.floor(Math.random() * 50) + 30,
  };
}
