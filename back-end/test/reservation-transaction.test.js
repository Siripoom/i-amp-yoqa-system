const { test } = require("node:test");
const assert = require("node:assert/strict");
const {
  ReservationTransactionError,
  withReservationTransaction,
} = require("../services/reservationTransaction");

test("runs reservation mutation inside one Mongo transaction and closes session", async () => {
  const events = [];
  const session = {
    async withTransaction(operation) {
      events.push("begin");
      await operation();
      events.push("commit");
    },
    async endSession() { events.push("end"); },
  };
  const result = await withReservationTransaction({
    mongooseInstance: { connection: { async startSession() { events.push("session"); return session; } } },
    operation: async (activeSession) => { events.push(activeSession === session ? "mutate" : "wrong-session"); return "ok"; },
  });
  assert.equal(result, "ok");
  assert.deepEqual(events, ["session", "begin", "mutate", "commit", "end"]);
});

test("does not silently fall back when transactions are unavailable", async () => {
  await assert.rejects(
    () => withReservationTransaction({ mongooseInstance: {}, operation: async () => {} }),
    (error) => error instanceof ReservationTransactionError && error.code === "RESERVATION_TRANSACTION_UNAVAILABLE"
  );
});
