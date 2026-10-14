import mongoose from 'mongoose';
import { Activity, Team, User, Workout } from '../models/index.js';

function badRequest(message: string) {
  return Object.assign(new Error(message), { status: 400 });
}

export async function listActivities() {
  return Activity.find().lean();
}

export async function createActivity(input: unknown) {
  if (!input || typeof input !== 'object') {
    throw badRequest('Activity payload is required');
  }

  const { userId, teamId, type, minutes } = input as Record<string, unknown>;

  if (typeof userId !== 'string' || !mongoose.isValidObjectId(userId)) {
    throw badRequest('A valid userId is required');
  }

  if (typeof teamId !== 'string' || !mongoose.isValidObjectId(teamId)) {
    throw badRequest('A valid teamId is required');
  }

  if (typeof type !== 'string' || !type.trim()) {
    throw badRequest('Activity type is required');
  }

  const numericMinutes = Number(minutes);
  if (!Number.isInteger(numericMinutes) || numericMinutes <= 0) {
    throw badRequest('Activity minutes must be a positive integer');
  }

  const [user, team] = await Promise.all([
    User.findById(userId),
    Team.findById(teamId),
  ]);

  if (!user || !team) {
    throw badRequest('Both user and team must exist');
  }

  return Activity.create({
    user: userId,
    team: teamId,
    type: type.trim(),
    minutes: numericMinutes,
    points: Math.max(1, numericMinutes),
    occurredAt: new Date(),
  });
}

export async function listTeams() {
  return Team.find().lean();
}

export async function createTeam(input: unknown) {
  if (!input || typeof input !== 'object') {
    throw badRequest('Team payload is required');
  }

  const { name, mascot, members } = input as Record<string, unknown>;

  if (typeof name !== 'string' || !name.trim()) {
    throw badRequest('Team name is required');
  }

  if (typeof mascot !== 'string' || !mascot.trim()) {
    throw badRequest('Team mascot is required');
  }

  const memberIds = Array.isArray(members) ? members : [];
  if (memberIds.some((member) => typeof member !== 'string' || !mongoose.isValidObjectId(member))) {
    throw badRequest('Team members must be valid user IDs');
  }

  const team = await Team.create({
    name: name.trim(),
    mascot: mascot.trim(),
    members: memberIds,
  });

  return team;
}

export async function getLeaderboard() {
  return [];
}

export async function suggestWorkouts(_userEmail: string) {
  return Workout.find().limit(1).lean();
}

export { User };
