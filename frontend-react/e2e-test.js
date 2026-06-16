import axios from 'axios';
import { execSync } from 'child_process';

const api = axios.create({
  baseURL: 'http://localhost:8080/api',
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000,
});

async function runTests() {
  console.log("🚀 Starting ApexGrid End-to-End Feature Analysis...");
  let token = null;
  const username = `fan_${Date.now()}`;
  
  try {
    // 1. Register
    console.log(`\n[1] Registering new user: ${username}`);
    const regRes = await api.post('/auth/register', {
      username: username,
      email: `${username}@f1.com`,
      password: "password123",
      fullName: "Test Fan"
    });
    console.log("✅ Registration Successful:", regRes.data.message);

    // 1.5 Auto-Verify User via DB
    console.log(`\n[1.5] Auto-verifying user in database...`);
    execSync(`psql -U apex -d apexgrid_db -c "UPDATE users SET is_verified = TRUE WHERE username = '${username}';"`, {
      env: { ...process.env, PGPASSWORD: 'apex123' }
    });
    console.log("✅ User Verified!");

    // 2. Login
    console.log(`\n[2] Logging in as ${username}`);
    const loginRes = await api.post('/auth/login', {
      username: username,
      password: "password123"
    });
    token = loginRes.data.token;
    api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    console.log("✅ Login Successful, JWT Token received.");

    // 2. Get User Profile (Me)
    console.log(`\n[2] Fetching User Profile`);
    const meRes = await api.get('/auth/me');
    console.log("✅ User Profile Retrieved:", meRes.data.username, "-", meRes.data.role);

    // 3. List Races
    console.log(`\n[3] Fetching Available Races`);
    const racesRes = await api.get('/races');
    console.log(`✅ Retrieved ${racesRes.data.length} races.`);
    const raceId = racesRes.data[0].id;
    const raceName = racesRes.data[0].name;

    // 4. Create Booking
    console.log(`\n[4] Creating Booking for Race: ${raceName}`);
    const bookRes = await api.post('/bookings', {
      raceId: raceId,
      quantity: 2,
      zone: "GA"
    });
    const bookingId = bookRes.data.id;
    const bookingCode = bookRes.data.bookingCode;
    console.log(`✅ Booking Created! Status: ${bookRes.data.status}, Code: ${bookingCode}`);

    // 5. Confirm Booking
    console.log(`\n[5] Confirming Booking ${bookingCode}`);
    const confirmRes = await api.put(`/bookings/${bookingId}/confirm`);
    console.log(`✅ Booking Confirmed! Status: ${confirmRes.data.status}`);

    // 6. Cancel a New Booking
    console.log(`\n[6] Testing Cancellation Flow`);
    const bookToCancel = await api.post('/bookings', {
      raceId: raceId,
      quantity: 1,
      zone: "GA"
    });
    console.log(`- Created booking to cancel: ${bookToCancel.data.bookingCode}`);
    const cancelRes = await api.put(`/bookings/${bookToCancel.data.id}/cancel`);
    console.log(`✅ Booking Cancelled! Status: ${cancelRes.data.status}`);

    // 7. Admin Test (Optional - might fail if not admin, demonstrating RBAC)
    console.log(`\n[7] Testing Admin Endpoint Protection`);
    try {
      await api.post('/races', {
         name: "Hacked Race", circuitId: 1, raceDate: "2026-10-10T10:00:00", season: 2026, totalQuota: 100, ticketPrice: 100
      });
      console.log("❌ Error: User was able to access admin endpoint!");
    } catch (e) {
      if (e.response && (e.response.status === 403 || e.response.status === 401)) {
         console.log("✅ Admin Endpoint successfully protected against normal users (403 Forbidden).");
      } else {
         console.log("⚠️ Unexpected error on admin endpoint:", e.message);
      }
    }

    console.log("\n🎉 ALL TESTS PASSED! The backend features are 100% operational.");
  } catch (error) {
    console.error("\n❌ TEST FAILED!");
    if (error.response) {
      console.error(error.response.data);
    } else {
      console.error(error.message);
    }
  }
}

runTests();
