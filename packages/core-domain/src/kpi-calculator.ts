export interface PropertyKPIMetrics {
  totalRooms: number;
  availableRooms: number; // totalRooms minus OUT_OF_ORDER rooms
  occupiedRooms: number;
  occupancyRate: number; // percentage, e.g. 78.5
  totalRoomRevenue: number;
  totalFnBRevenue: number;
  totalOtherRevenue: number;
  totalGrossRevenue: number;
  adr: number; // Average Daily Rate
  revPar: number; // Revenue Per Available Room
  tRevPar: number; // Total Revenue Per Available Room
}

export class KPICalculator {
  /**
   * Computes executive hospitality KPIs for a property snapshot or period.
   */
  public static calculateMetrics(params: {
    totalRooms: number;
    outOfOrderRooms: number;
    occupiedRooms: number;
    roomRevenue: number;
    fnbRevenue: number;
    otherRevenue: number;
  }): PropertyKPIMetrics {
    const {
      totalRooms,
      outOfOrderRooms,
      occupiedRooms,
      roomRevenue,
      fnbRevenue,
      otherRevenue,
    } = params;

    const availableRooms = Math.max(1, totalRooms - outOfOrderRooms);
    const validOccupied = Math.min(availableRooms, Math.max(0, occupiedRooms));

    const occupancyRate = Math.round(((validOccupied / availableRooms) * 100) * 10) / 10;
    const adr = validOccupied > 0 ? Math.round((roomRevenue / validOccupied) * 100) / 100 : 0;
    const revPar = Math.round((roomRevenue / availableRooms) * 100) / 100;
    const totalGrossRevenue = Math.round((roomRevenue + fnbRevenue + otherRevenue) * 100) / 100;
    const tRevPar = Math.round((totalGrossRevenue / availableRooms) * 100) / 100;

    return {
      totalRooms,
      availableRooms,
      occupiedRooms: validOccupied,
      occupancyRate,
      totalRoomRevenue: Math.round(roomRevenue * 100) / 100,
      totalFnBRevenue: Math.round(fnbRevenue * 100) / 100,
      totalOtherRevenue: Math.round(otherRevenue * 100) / 100,
      totalGrossRevenue,
      adr,
      revPar,
      tRevPar,
    };
  }

  /**
   * Calculates Average Length of Stay (ALOS)
   */
  public static calculateALOS(totalRoomNights: number, totalBookings: number): number {
    if (totalBookings <= 0) return 0;
    return Math.round((totalRoomNights / totalBookings) * 10) / 10;
  }
}
