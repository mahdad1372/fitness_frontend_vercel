export interface EquipmentDto {
  equipmentId: number;
  name: string;
  capacity: number;
}

// Browsing available coaches when subscribing/switching your ONE active
// coach. No fixed price catalog exists yet (price is set per Cart row at
// subscribe time), so this is just the identity.
export interface CoachSummary {
  coachId: number;
  name: string;
}

// GET /api/students/{studentId}/coach - backed by the existing Cart table
// (cart_item = "PRIVATE COACH"), the same source the sidebar/Chat already
// use. assigned=false (every other field null) means no coach yet.
// cartId tells the frontend whether "Subscribe"/"Change Coach" should
// create a new Cart row or update the existing one.
export interface MyCoachDto {
  assigned: boolean;
  cartId: number | null;
  coachId: number | null;
  name: string | null;
  monthlyPrice: number | null;
}

export interface SessionRequestDto {
  requestId: number;
  studentId: number;
  studentName: string;
  coachId: number;
  coachName: string;
  equipmentId: number | null;
  equipmentName: string | null;
  startTime: string; // ISO datetime string
  endTime: string;
  status: "PENDING" | "ACCEPTED" | "REJECTED";
  // Cardiovascular Risk -> Trainer & Equipment Scheduler: true when the
  // requested end time had to be pulled in because it exceeded this
  // student's current risk-based session ceiling.
  cappedForRisk: boolean;
}

// No coachId/price anymore - the coach is always the student's one active
// coach (read server-side from Cart), not chosen per booking.
export interface CreateSessionRequestPayload {
  studentId: number;
  equipmentId: number | null;
  startTime: string; // ISO datetime string
  endTime: string;
}

export interface OptimizeScheduleResponse {
  acceptedSessions: SessionRequestDto[];
  rejectedSessions: SessionRequestDto[];
  requestsConsidered: number;
  nodesExplored: number;
}

// Live "gym floor" snapshot for one equipment type - polled every few
// seconds by the Equipment Board, separate from the advance-booking flow
// above.
export interface EquipmentStatusDto {
  equipmentId: number;
  name: string;
  capacity: number;
  inUse: number;
  available: number;
  queueLength: number;
  checkedInByMe: boolean;
  myQueuePosition: number | null; // 1-based; null if not queued
}

export interface EquipmentQueueEntryDto {
  queueId: number;
  equipmentId: number;
  userId: number;
  userName: string;
  joinedAt: string;
  position: number; // 1-based
}