export type Role = "student" | "admin";

export type Me = {
  id: string;
  name: string;
  email: string;
  image: string | null;
  role: Role;
  studentId?: string;
  department?: string;
  batch?: string;
  phone?: string;
  bio?: string;
  interests?: string[];
  social?: { facebook?: string; linkedin?: string; github?: string; x?: string };
  waiverPercent?: number;
  createdAt?: string;
};

export type Paged<T> = { items: T[]; total: number; page: number; pages: number };

export type Slot = { id?: string; day: string; start: string; end: string; room?: string };
export type Instructor = { name: string; title?: string; email?: string };

export type CourseCard = {
  id: string;
  code: string;
  title: string;
  department: string;
  level: number;
  credits: number;
  category: string;
  image: string;
  summary: string;
  prerequisites: string[];
  tags: string[];
  featured: boolean;
  lectureCount: number;
  noteCount: number;
};

export type Lecture = { id: string; title: string; youtubeId: string; minutes?: number; channel?: string };
export type Note = { id: string; title: string; kind: "note" | "link" | "pdf" | "slides"; url?: string; body?: string; description?: string };

export type SemesterLite = { id: string; name: string; startDate?: string; endDate?: string; status?: string; registrationOpen?: boolean };

export type Semester = SemesterLite & {
  season: string;
  year: number;
  registrationDeadline?: string;
  evaluationOpen: boolean;
  minCredits: number;
  maxCredits: number;
  fees: { perCredit: number; registration: number; library: number; activity: number };
};

export type SectionRow = {
  id: string;
  semester: SemesterLite;
  course: string;
  name: string;
  instructor: Instructor;
  schedule: Slot[];
  capacity: number;
  enrolled: number;
};

export type CourseDetail = {
  course: CourseCard & {
    description: string;
    topics: string[];
    outcomes: string[];
    assessment: { id: string; label: string; weight: number }[];
    lectures: Lecture[];
    notes: Note[];
  };
  sections: SectionRow[];
  progress: string[];
  enrollment: { id: string; status: string; semester?: string; grade?: string } | null;
  related: CourseCard[];
  chatId: string | null;
};

export type ClubCard = { id: string; name: string; category: string; tagline: string; image: string; founded: number; tags: string[]; members: number };
export type ClubDetail = {
  club: ClubCard & {
    description: string;
    advisor: string;
    president: string;
    meets: string;
    email: string;
    achievements: string[];
    social: { facebook?: string; instagram?: string; x?: string };
  };
  memberCount: number;
  isMember: boolean;
  members: { id: string; role: string; name: string; image: string | null; department?: string }[];
  events: { id: string; title: string; category: string; image: string; venue: string; startAt: string }[];
  chatId: string | null;
};

export type EventCard = {
  id: string;
  title: string;
  category: string;
  summary: string;
  image: string;
  venue: string;
  startAt: string;
  endAt: string;
  capacity: number;
  registered: number;
  club?: { id: string; name: string } | null;
  status: "upcoming" | "past" | "live";
};
export type EventDetail = {
  event: EventCard & {
    description: string;
    agenda: { id: string; time: string; title: string }[];
    speakers: { id: string; name: string; title: string }[];
    tags: string[];
    club?: { id: string; name: string; image?: string } | null;
  };
  isRegistered: boolean;
  ticketNo: string | null;
  attendees: { id: string; name: string; image: string | null }[];
};

export type Notice = {
  id: string;
  title: string;
  body?: string;
  excerpt?: string;
  category: string;
  priority: "normal" | "important" | "urgent";
  pinned: boolean;
  author: string;
  publishedAt: string;
  attachments?: { name: string; url: string }[];
};

export type InvoiceItem = { id?: string; label: string; amount: number };
export type Installment = { no: number; amount: number; dueDate: string; paid: boolean };
export type Invoice = {
  id: string;
  number: string;
  student: string;
  semester?: { id: string; name: string } | null;
  type: "tuition" | "transport";
  title: string;
  items: InvoiceItem[];
  subtotal: number;
  waiverPercent: number;
  waiverAmount: number;
  total: number;
  paid: number;
  due: number;
  dueDate: string;
  status: "unpaid" | "partial" | "paid" | "cancelled";
  installments: Installment[];
  overdue?: boolean;
  next: { no: number; amount: number; dueDate: string } | null;
  createdAt: string;
};
export type Payment = {
  id: string;
  invoice: { id: string; number: string; type: string; title: string } | string;
  amount: number;
  /** "wallet" is what older payments were called before bKash, Nagad and Rocket were listed one by one */
  method: "bkash" | "nagad" | "rocket" | "card" | "bank" | "wallet";
  status: "pending" | "success" | "failed" | "refunded";
  txnId: string;
  receiptNo: string;
  installmentNo?: number;
  payerRef?: string;
  paidAt?: string;
  createdAt: string;
};

export type Stop = { name: string; time: string };
export type Route = { id: string; name: string; code: string; busNo: string; image: string; stops: Stop[]; fee: number; capacity: number; enrolled: number; seatsLeft: number; active: boolean };
export type Pass = {
  id: string;
  semester: { id: string; name: string; startDate?: string; endDate?: string };
  route: { id: string; name: string; code: string; busNo: string; stops: Stop[]; fee: number };
  stop: string;
  status: "pending" | "active" | "expired" | "cancelled";
  passNo: string;
  invoice: { id: string; number: string; total: number; paid: number; dueDate: string; status: string } | null;
  validFrom?: string;
  validTo?: string;
};

export type Person = { id: string; name: string; image: string | null; department?: string | null };
export type Conversation = {
  id: string;
  kind: "direct" | "group";
  name: string;
  image: string | null;
  refKind: "club" | "course" | null;
  refId: string | null;
  otherId: string | null;
  department: string | null;
  memberCount: number;
  last: { text: string; sender: string; at: string } | null;
  unread: number;
};
export type ChatMessage = { id: string; conversation: string; sender: string; text: string; createdAt: string; readBy?: string[]; pending?: boolean };

export type AppNotification = { id: string; type: string; title: string; body?: string; link?: string; read: boolean; createdAt: string };

export type HistoryCourse = {
  id: string;
  course: { id: string; code: string; title: string; credits: number; department: string; category: string; image: string };
  section?: { id?: string; name: string; instructor?: Instructor; schedule?: Slot[] } | null;
  status: string;
  evaluated: boolean;
  marks: number | null;
  grade: string | null;
  gradePoint: number | null;
};
export type HistorySemester = {
  semester: { id: string; name: string; season: string; year: number; startDate: string; endDate: string; status: string; evaluationOpen: boolean };
  courses: HistoryCourse[];
  credits: number;
  earnedCredits: number;
  gpa: number | null;
  locked: boolean;
  pendingEvaluations: number;
};

export type Student = { id: string; name: string; image: string | null; department?: string | null; batch?: string | null; studentId?: string | null; bio?: string | null };
