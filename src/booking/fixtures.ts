import type {AppRecordState} from './types';
/** Fictional demo dataset. Emails use reserved .invalid domains and no customer data is used. */
export const exampleRecords:AppRecordState={
  "clients": [
    {
      "id": "CL-0001",
      "name": "Amara Okafor",
      "email": "amara.okafor@example.invalid",
      "phone": "+234 800 000 0001",
      "notes": "Discuss priorities at the next consultation.",
      "stage": "Active"
    },
    {
      "id": "CL-0002",
      "name": "Daniel Ade",
      "email": "daniel.ade@example.invalid",
      "phone": "+234 800 000 0002",
      "notes": "",
      "stage": "Follow up"
    },
    {
      "id": "CL-0003",
      "name": "Femi Bello",
      "email": "femi.bello@example.invalid",
      "phone": "+234 800 000 0003",
      "notes": "",
      "stage": "Active"
    },
    {
      "id": "CL-0004",
      "name": "Zainab Lawal",
      "email": "zainab.lawal@example.invalid",
      "phone": "+234 800 000 0004",
      "notes": "Discuss priorities at the next consultation.",
      "stage": "New"
    },
    {
      "id": "CL-0005",
      "name": "Chidinma Eze",
      "email": "chidinma.eze@example.invalid",
      "phone": "+234 800 000 0005",
      "notes": "",
      "stage": "Active"
    },
    {
      "id": "CL-0006",
      "name": "Tunde Bakare",
      "email": "tunde.bakare@example.invalid",
      "phone": "+234 800 000 0006",
      "notes": "",
      "stage": "Follow up"
    },
    {
      "id": "CL-0007",
      "name": "Hauwa Yusuf",
      "email": "hauwa.yusuf@example.invalid",
      "phone": "+234 800 000 0007",
      "notes": "Discuss priorities at the next consultation.",
      "stage": "New"
    },
    {
      "id": "CL-0008",
      "name": "Samuel Nwosu",
      "email": "samuel.nwosu@example.invalid",
      "phone": "+234 800 000 0008",
      "notes": "",
      "stage": "Active"
    },
    {
      "id": "CL-0009",
      "name": "Fatima Bello",
      "email": "fatima.bello@example.invalid",
      "phone": "+234 800 000 0009",
      "notes": "",
      "stage": "New"
    },
    {
      "id": "CL-0010",
      "name": "Adaobi Umeh",
      "email": "adaobi.umeh@example.invalid",
      "phone": "+234 800 000 0010",
      "notes": "Discuss priorities at the next consultation.",
      "stage": "Follow up"
    },
    {
      "id": "CL-0011",
      "name": "Bola Adeyemi",
      "email": "bola.adeyemi@example.invalid",
      "phone": "+234 800 000 0011",
      "notes": "",
      "stage": "Active"
    },
    {
      "id": "CL-0012",
      "name": "Kabiru Sani",
      "email": "kabiru.sani@example.invalid",
      "phone": "+234 800 000 0012",
      "notes": "",
      "stage": "New"
    }
  ],
  "services": [
    {
      "id": "SV-01",
      "title": "Business strategy consultation",
      "minutes": 60,
      "price": 25000,
      "deposit": 10000,
      "format": "Google Meet",
      "description": "Focused guidance on business growth, priorities and decisions.",
      "active": true,
      "policy": "Deposit",
      "intakeQuestions": [
        {
          "id": "Q-STRATEGY",
          "label": "What business goal would you like to discuss?",
          "help": "A brief summary is enough.",
          "kind": "Long answer",
          "required": false
        }
      ]
    },
    {
      "id": "SV-02",
      "title": "Project scoping session",
      "minutes": 45,
      "price": 15000,
      "deposit": 0,
      "format": "In person",
      "description": "Clarify project outcomes, requirements and delivery expectations.",
      "active": true,
      "policy": "Pay later"
    },
    {
      "id": "SV-03",
      "title": "Introductory discovery call",
      "minutes": 30,
      "price": 0,
      "deposit": 0,
      "format": "Zoom",
      "description": "A quick conversation to explore fit and next steps.",
      "active": true,
      "policy": "Free"
    },
    {
      "id": "SV-04",
      "title": "Brand identity consultation",
      "minutes": 45,
      "price": 18000,
      "deposit": 18000,
      "format": "Google Meet",
      "description": "Review brand direction, audience and visual identity goals.",
      "active": true,
      "policy": "Full prepayment"
    },
    {
      "id": "SV-05",
      "title": "Website project consultation",
      "minutes": 60,
      "price": 30000,
      "deposit": 15000,
      "format": "Microsoft Teams",
      "description": "Plan a website brief, scope and technical approach.",
      "active": true,
      "policy": "Deposit"
    },
    {
      "id": "SV-06",
      "title": "Career mentoring session",
      "minutes": 40,
      "price": 0,
      "deposit": 0,
      "format": "Google Meet",
      "description": "Discuss career goals, skills and practical next steps.",
      "active": true,
      "policy": "Free"
    },
    {
      "id": "SV-07",
      "title": "Product design review",
      "minutes": 75,
      "price": 35000,
      "deposit": 0,
      "format": "Zoom",
      "description": "Walk through UX priorities and design improvements.",
      "active": true,
      "policy": "Pay later"
    },
    {
      "id": "SV-08",
      "title": "Private planning session",
      "minutes": 90,
      "price": 50000,
      "deposit": 25000,
      "format": "In person",
      "description": "A longer appointment for an in-depth planning discussion.",
      "active": false,
      "policy": "Deposit"
    }
  ],
  "bookings": [
    {
      "id": "BK-00084",
      "clientId": "CL-0001",
      "serviceId": "SV-01",
      "date": "2026-10-20",
      "time": "09:00",
      "status": "Confirmed",
      "method": "Merchant bank",
      "note": "Discussion of growth priorities."
    },
    {
      "id": "BK-00085",
      "clientId": "CL-0002",
      "serviceId": "SV-02",
      "date": "2026-10-20",
      "time": "10:00",
      "status": "Awaiting bank review",
      "method": "Merchant bank",
      "note": "Project discovery and milestones."
    },
    {
      "id": "BK-00086",
      "clientId": "CL-0003",
      "serviceId": "SV-03",
      "date": "2026-10-21",
      "time": "11:30",
      "status": "Confirmed",
      "method": "Free",
      "note": "Follow-up consultation."
    },
    {
      "id": "BK-00087",
      "clientId": "CL-0004",
      "serviceId": "SV-04",
      "date": "2026-10-22",
      "time": "14:00",
      "status": "Awaiting payment",
      "method": "Merchant bank",
      "note": "Initial enquiry meeting."
    },
    {
      "id": "BK-00088",
      "clientId": "CL-0005",
      "serviceId": "SV-05",
      "date": "2026-10-23",
      "time": "15:00",
      "status": "Confirmed",
      "method": "Gateway",
      "note": "Discussion of growth priorities."
    },
    {
      "id": "BK-00089",
      "clientId": "CL-0006",
      "serviceId": "SV-06",
      "date": "2026-10-23",
      "time": "16:00",
      "status": "Awaiting payment",
      "method": "Free",
      "note": "Project discovery and milestones."
    },
    {
      "id": "BK-00090",
      "clientId": "CL-0007",
      "serviceId": "SV-07",
      "date": "2026-10-24",
      "time": "09:00",
      "status": "Awaiting bank review",
      "method": "Merchant bank",
      "note": "Follow-up consultation."
    },
    {
      "id": "BK-00091",
      "clientId": "CL-0008",
      "serviceId": "SV-01",
      "date": "2026-10-26",
      "time": "10:00",
      "status": "Confirmed",
      "method": "Gateway",
      "note": "Initial enquiry meeting."
    },
    {
      "id": "BK-00092",
      "clientId": "CL-0009",
      "serviceId": "SV-02",
      "date": "2026-10-27",
      "time": "11:30",
      "status": "Confirmed",
      "method": "Gateway",
      "note": "Discussion of growth priorities."
    },
    {
      "id": "BK-00093",
      "clientId": "CL-0010",
      "serviceId": "SV-03",
      "date": "2026-10-28",
      "time": "14:00",
      "status": "Cancelled",
      "method": "Free",
      "note": "Project discovery and milestones."
    },
    {
      "id": "BK-00094",
      "clientId": "CL-0011",
      "serviceId": "SV-04",
      "date": "2026-10-29",
      "time": "15:00",
      "status": "Confirmed",
      "method": "Gateway",
      "note": "Follow-up consultation."
    },
    {
      "id": "BK-00095",
      "clientId": "CL-0012",
      "serviceId": "SV-05",
      "date": "2026-10-30",
      "time": "16:00",
      "status": "Awaiting payment",
      "method": "Gateway",
      "note": "Initial enquiry meeting."
    },
    {
      "id": "BK-00096",
      "clientId": "CL-0001",
      "serviceId": "SV-06",
      "date": "2026-11-02",
      "time": "09:00",
      "status": "Confirmed",
      "method": "Free",
      "note": "Discussion of growth priorities."
    },
    {
      "id": "BK-00097",
      "clientId": "CL-0002",
      "serviceId": "SV-07",
      "date": "2026-11-03",
      "time": "10:00",
      "status": "Awaiting bank review",
      "method": "Merchant bank",
      "note": "Project discovery and milestones."
    },
    {
      "id": "BK-00098",
      "clientId": "CL-0003",
      "serviceId": "SV-01",
      "date": "2026-11-04",
      "time": "11:30",
      "status": "Confirmed",
      "method": "Gateway",
      "note": "Follow-up consultation."
    },
    {
      "id": "BK-00099",
      "clientId": "CL-0004",
      "serviceId": "SV-02",
      "date": "2026-11-05",
      "time": "14:00",
      "status": "Confirmed",
      "method": "Merchant bank",
      "note": "Initial enquiry meeting."
    },
    {
      "id": "BK-00100",
      "clientId": "CL-0005",
      "serviceId": "SV-03",
      "date": "2026-11-06",
      "time": "15:00",
      "status": "Awaiting payment",
      "method": "Free",
      "note": "Discussion of growth priorities."
    },
    {
      "id": "BK-00101",
      "clientId": "CL-0006",
      "serviceId": "SV-04",
      "date": "2026-11-09",
      "time": "16:00",
      "status": "Confirmed",
      "method": "Gateway",
      "note": "Project discovery and milestones."
    },
    {
      "id": "BK-00102",
      "clientId": "CL-0007",
      "serviceId": "SV-05",
      "date": "2026-11-10",
      "time": "09:00",
      "status": "Cancelled",
      "method": "Merchant bank",
      "note": "Follow-up consultation."
    },
    {
      "id": "BK-00103",
      "clientId": "CL-0008",
      "serviceId": "SV-06",
      "date": "2026-11-11",
      "time": "10:00",
      "status": "Confirmed",
      "method": "Free",
      "note": "Initial enquiry meeting."
    },
    {
      "id": "BK-00104",
      "clientId": "CL-0009",
      "serviceId": "SV-07",
      "date": "2026-11-12",
      "time": "11:30",
      "status": "Awaiting bank review",
      "method": "Merchant bank",
      "note": "Discussion of growth priorities."
    },
    {
      "id": "BK-00105",
      "clientId": "CL-0010",
      "serviceId": "SV-01",
      "date": "2026-11-13",
      "time": "14:00",
      "status": "Confirmed",
      "method": "Merchant bank",
      "note": "Project discovery and milestones."
    },
    {
      "id": "BK-00106",
      "clientId": "CL-0011",
      "serviceId": "SV-02",
      "date": "2026-11-16",
      "time": "15:00",
      "status": "Awaiting payment",
      "method": "Gateway",
      "note": "Follow-up consultation."
    }
  ],
  "enquiries": [
    {
      "id": "ENQ-0001",
      "clientId": "CL-0001",
      "subject": "Growth strategy advisory",
      "brief": "Interested in exploring options, defining next steps and agreeing a suitable appointment.",
      "status": "Reviewing",
      "notes": "Follow up at a suitable time."
    },
    {
      "id": "ENQ-0002",
      "clientId": "CL-0002",
      "subject": "Website project scope",
      "brief": "Interested in exploring options, defining next steps and agreeing a suitable appointment.",
      "status": "New",
      "notes": ""
    },
    {
      "id": "ENQ-0003",
      "clientId": "CL-0003",
      "subject": "Market assessment",
      "brief": "Interested in exploring options, defining next steps and agreeing a suitable appointment.",
      "status": "Qualified",
      "notes": ""
    },
    {
      "id": "ENQ-0004",
      "clientId": "CL-0004",
      "subject": "Visual identity refresh",
      "brief": "Interested in exploring options, defining next steps and agreeing a suitable appointment.",
      "status": "New",
      "notes": "Follow up at a suitable time."
    },
    {
      "id": "ENQ-0005",
      "clientId": "CL-0005",
      "subject": "Digital presence consultation",
      "brief": "Interested in exploring options, defining next steps and agreeing a suitable appointment.",
      "status": "Reviewing",
      "notes": ""
    },
    {
      "id": "ENQ-0006",
      "clientId": "CL-0006",
      "subject": "Staff training schedule",
      "brief": "Interested in exploring options, defining next steps and agreeing a suitable appointment.",
      "status": "Qualified",
      "notes": ""
    },
    {
      "id": "ENQ-0007",
      "clientId": "CL-0007",
      "subject": "Product feedback session",
      "brief": "Interested in exploring options, defining next steps and agreeing a suitable appointment.",
      "status": "Declined",
      "notes": "Follow up at a suitable time."
    },
    {
      "id": "ENQ-0008",
      "clientId": "CL-0008",
      "subject": "Partnership enquiry",
      "brief": "Interested in exploring options, defining next steps and agreeing a suitable appointment.",
      "status": "New",
      "notes": ""
    },
    {
      "id": "ENQ-0009",
      "clientId": "CL-0009",
      "subject": "Operations planning",
      "brief": "Interested in exploring options, defining next steps and agreeing a suitable appointment.",
      "status": "Reviewing",
      "notes": ""
    },
    {
      "id": "ENQ-0010",
      "clientId": "CL-0010",
      "subject": "Career guidance",
      "brief": "Interested in exploring options, defining next steps and agreeing a suitable appointment.",
      "status": "Qualified",
      "notes": "Follow up at a suitable time."
    }
  ],
  "availability": {
    "timezone": "Africa/Lagos",
    "bufferBefore": 0,
    "bufferAfter": 15,
    "minNoticeHours": 24,
    "maxAdvanceDays": 60,
    "overrides": [
      {
        "id": "2026-11-01",
        "date": "2026-11-01",
        "closed": true,
        "windows": [],
        "note": "Office closed"
      }
    ]
  },
  "hours": {
    "0": [],
    "1": [
      {
        "start": "09:00",
        "end": "17:00"
      }
    ],
    "2": [
      {
        "start": "09:00",
        "end": "17:00"
      }
    ],
    "3": [
      {
        "start": "09:00",
        "end": "17:00"
      }
    ],
    "4": [
      {
        "start": "09:00",
        "end": "17:00"
      }
    ],
    "5": [
      {
        "start": "09:00",
        "end": "16:00"
      }
    ],
    "6": []
  }
};
export function emptyRecords():AppRecordState {return {bookings:[],clients:[],enquiries:[],services:[],hours:structuredClone(exampleRecords.hours),availability:structuredClone(exampleRecords.availability)}};
