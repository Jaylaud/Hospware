import { RoomStatus, UserRole } from './types';

export interface TransitionRule {
  from: RoomStatus;
  to: RoomStatus;
  allowedRoles: UserRole[];
  requiresReason?: boolean;
}

export const ROOM_TRANSITION_RULES: TransitionRule[] = [
  // Vacant Dirty -> Cleaning in Progress (Housekeeper, Supervisor)
  {
    from: RoomStatus.VACANT_DIRTY,
    to: RoomStatus.CLEANING_IN_PROGRESS,
    allowedRoles: [UserRole.HOUSEKEEPER, UserRole.HOUSEKEEPING_SUPERVISOR, UserRole.FRONT_DESK, UserRole.GENERAL_MANAGER, UserRole.OWNER],
  },
  // Cleaning in Progress -> Vacant Clean (Housekeeper, Supervisor)
  {
    from: RoomStatus.CLEANING_IN_PROGRESS,
    to: RoomStatus.VACANT_CLEAN,
    allowedRoles: [UserRole.HOUSEKEEPER, UserRole.HOUSEKEEPING_SUPERVISOR, UserRole.GENERAL_MANAGER, UserRole.OWNER],
  },
  // Vacant Clean -> Inspected (Supervisor / GM / Owner)
  {
    from: RoomStatus.VACANT_CLEAN,
    to: RoomStatus.INSPECTED,
    allowedRoles: [UserRole.HOUSEKEEPING_SUPERVISOR, UserRole.GENERAL_MANAGER, UserRole.OWNER],
  },
  // Inspected / Vacant Clean -> Occupied Clean (Check-in by Front Desk)
  {
    from: RoomStatus.INSPECTED,
    to: RoomStatus.OCCUPIED_CLEAN,
    allowedRoles: [UserRole.FRONT_DESK, UserRole.GENERAL_MANAGER, UserRole.OWNER],
  },
  {
    from: RoomStatus.VACANT_CLEAN,
    to: RoomStatus.OCCUPIED_CLEAN,
    allowedRoles: [UserRole.FRONT_DESK, UserRole.GENERAL_MANAGER, UserRole.OWNER],
  },
  // Occupied Clean -> Occupied Dirty (Daily stayover / housekeeping trigger)
  {
    from: RoomStatus.OCCUPIED_CLEAN,
    to: RoomStatus.OCCUPIED_DIRTY,
    allowedRoles: [UserRole.HOUSEKEEPER, UserRole.HOUSEKEEPING_SUPERVISOR, UserRole.FRONT_DESK, UserRole.GENERAL_MANAGER, UserRole.OWNER],
  },
  // Occupied Dirty -> Occupied Clean (Stayover serviced)
  {
    from: RoomStatus.OCCUPIED_DIRTY,
    to: RoomStatus.OCCUPIED_CLEAN,
    allowedRoles: [UserRole.HOUSEKEEPER, UserRole.HOUSEKEEPING_SUPERVISOR, UserRole.GENERAL_MANAGER, UserRole.OWNER],
  },
  // Occupied Clean / Occupied Dirty -> Vacant Dirty (Checkout by Front Desk)
  {
    from: RoomStatus.OCCUPIED_CLEAN,
    to: RoomStatus.VACANT_DIRTY,
    allowedRoles: [UserRole.FRONT_DESK, UserRole.GENERAL_MANAGER, UserRole.OWNER],
  },
  {
    from: RoomStatus.OCCUPIED_DIRTY,
    to: RoomStatus.VACANT_DIRTY,
    allowedRoles: [UserRole.FRONT_DESK, UserRole.GENERAL_MANAGER, UserRole.OWNER],
  },
  // Any Vacant Status -> Out of Service (Maintenance repair)
  {
    from: RoomStatus.VACANT_CLEAN,
    to: RoomStatus.OUT_OF_SERVICE,
    allowedRoles: [UserRole.MAINTENANCE, UserRole.HOUSEKEEPING_SUPERVISOR, UserRole.FRONT_DESK, UserRole.GENERAL_MANAGER, UserRole.OWNER],
    requiresReason: true,
  },
  {
    from: RoomStatus.VACANT_DIRTY,
    to: RoomStatus.OUT_OF_SERVICE,
    allowedRoles: [UserRole.MAINTENANCE, UserRole.HOUSEKEEPING_SUPERVISOR, UserRole.FRONT_DESK, UserRole.GENERAL_MANAGER, UserRole.OWNER],
    requiresReason: true,
  },
  // Out of Service -> Vacant Dirty (Maintenance done, ready for cleaning)
  {
    from: RoomStatus.OUT_OF_SERVICE,
    to: RoomStatus.VACANT_DIRTY,
    allowedRoles: [UserRole.MAINTENANCE, UserRole.HOUSEKEEPING_SUPERVISOR, UserRole.GENERAL_MANAGER, UserRole.OWNER],
  },
  // Out of Order (Deep renovation, excluded from inventory)
  {
    from: RoomStatus.VACANT_DIRTY,
    to: RoomStatus.OUT_OF_ORDER,
    allowedRoles: [UserRole.GENERAL_MANAGER, UserRole.OWNER],
    requiresReason: true,
  },
  {
    from: RoomStatus.OUT_OF_ORDER,
    to: RoomStatus.VACANT_DIRTY,
    allowedRoles: [UserRole.GENERAL_MANAGER, UserRole.OWNER],
  },
];

export class RoomStateMachine {
  /**
   * Evaluates whether a transition from currentStatus to nextStatus is valid for given role.
   */
  public static canTransition(currentStatus: RoomStatus, nextStatus: RoomStatus, role: UserRole): boolean {
    if (currentStatus === nextStatus) return true;

    // Owners and GMs can force override when needed
    if (role === UserRole.OWNER || role === UserRole.GENERAL_MANAGER) {
      return true;
    }

    const rule = ROOM_TRANSITION_RULES.find(
      (r) => r.from === currentStatus && r.to === nextStatus
    );

    if (!rule) return false;
    return rule.allowedRoles.includes(role);
  }

  /**
   * Retrieves all available target statuses from current status for a given role.
   */
  public static getAvailableTransitions(currentStatus: RoomStatus, role: UserRole): RoomStatus[] {
    const rules = ROOM_TRANSITION_RULES.filter(
      (r) => r.from === currentStatus && (r.allowedRoles.includes(role) || role === UserRole.OWNER || role === UserRole.GENERAL_MANAGER)
    );

    return Array.from(new Set(rules.map((r) => r.to)));
  }

  /**
   * Quick action status for housekeeping mobile UI tap
   */
  public static getNextQuickHousekeepingStatus(currentStatus: RoomStatus): RoomStatus | null {
    switch (currentStatus) {
      case RoomStatus.VACANT_DIRTY:
        return RoomStatus.CLEANING_IN_PROGRESS;
      case RoomStatus.CLEANING_IN_PROGRESS:
        return RoomStatus.VACANT_CLEAN;
      case RoomStatus.OCCUPIED_DIRTY:
        return RoomStatus.OCCUPIED_CLEAN;
      default:
        return null;
    }
  }
}
