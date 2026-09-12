# I AM P YOQA System

The system manages yoga members, class schedules, reservations, class entitlements, and the communications that keep members informed about their bookings.

## Language

**Member**:
A person registered with the yoga business who may hold class entitlements and make reservations.
_Avoid_: Customer, user account

**Class**:
A scheduled yoga teaching session with a defined start and end time and attendance details.
_Avoid_: Course, session

**Reservation**:
A member's active or cancelled claim to attend one class.
_Avoid_: Booking record, enrollment

**Class entitlement**:
One unit of a member's purchased right to reserve a class. A reservation consumes one entitlement, and an eligible cancellation restores one.
_Avoid_: Credit, session, class count

**LINE-linked member**:
A member whose account is connected to one verified LINE identity and can disconnect that identity at any time.
_Avoid_: LINE user, LINE-login account

**LINE-ready member**:
A LINE-linked member who has also added the Official Account as a friend and is currently eligible for dependable transactional notifications.
_Avoid_: Connected user, subscribed member

**Transactional notification**:
A LINE message that reports a committed reservation event, including confirmation, cancellation, or a material class change. It is sent while the member keeps LINE linked.
_Avoid_: Reminder, marketing message

**Reminder**:
An optional LINE message sent before an upcoming reserved class. A member may disable reminders without disconnecting LINE.
_Avoid_: Transactional notification

**Material class change**:
A change to a reserved class's date or time, instructor, location, attendance mode, or online access link that members need in order to attend correctly.
_Avoid_: Class edit, schedule update

**Class cancellation**:
The retained record of a class that will no longer take place. It cancels active reservations, restores eligible class entitlements, and prevents pending reminders.
_Avoid_: Class deletion

**Notification acceptance**:
Confirmation that LINE accepted a notification request for processing; it is not evidence that the member received or read the message.
_Avoid_: Delivered, read

**Notification settings**:
The business-wide rules governing reminder timing, quiet hours, and the portion of the LINE message allowance reserved for transactional notifications.
_Avoid_: LINE configuration, message template
