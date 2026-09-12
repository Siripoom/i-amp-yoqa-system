class ReservationTransactionError extends Error {
  constructor(message, code = "RESERVATION_TRANSACTION_UNAVAILABLE") {
    super(message);
    this.name = "ReservationTransactionError";
    this.code = code;
  }
}

/**
 * Execute a reservation lifecycle mutation in a MongoDB transaction.
 * MongoDB must be replica-set capable; there is deliberately no fallback to
 * independent saves because a partial entitlement/class/reservation update
 * is worse than rejecting the operation.
 */
async function withReservationTransaction({ mongooseInstance, operation }) {
  if (!mongooseInstance?.connection?.startSession) {
    throw new ReservationTransactionError("MongoDB transaction support is unavailable");
  }

  const session = await mongooseInstance.connection.startSession();
  try {
    let result;
    await session.withTransaction(async () => {
      result = await operation(session);
    });
    return result;
  } catch (error) {
    if (error?.code === 251 || /transaction numbers are only allowed/i.test(error?.message || "")) {
      throw new ReservationTransactionError(
        "MongoDB must run as a replica set to mutate reservations",
        "RESERVATION_TRANSACTION_REQUIRED"
      );
    }
    throw error;
  } finally {
    await session.endSession();
  }
}

module.exports = { ReservationTransactionError, withReservationTransaction };
