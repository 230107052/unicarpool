
import test from 'node:test';
import assert from 'node:assert/strict';

process.env.SUPABASE_URL = 'https://example.supabase.co';
process.env.SUPABASE_ANON_KEY = 'test-key';
process.env.UNIVERSITY_EMAIL_DOMAIN = 'sdu.edu.kz';

const { reserve } = await import('./service.js');

test('rejects reservation without trip ID', async () => {
  await assert.rejects(
    reserve('test-token', null),
    (error) => {
      assert.equal(error.status, 400);
      assert.equal(error.message, 'tripId is required');
      return true;
    }
  );
});

test('successfully reserves a seat', async () => {
  const expectedReservation = {
    id: 'reservation-1',
    trip_id: 'trip-1',
    passenger_id: 'student-1',
    status: 'confirmed'
  };

  const mockClientFactory = (token) => {
    assert.equal(token, 'test-token');

    return {
      rpc: async (functionName, parameters) => {
        assert.equal(functionName, 'reserve_seat');
        assert.deepEqual(parameters, { p_trip_id: 'trip-1' });

        return {
          data: expectedReservation,
          error: null
        };
      }
    };
  };

  const result = await reserve(
    'test-token',
    'trip-1',
    mockClientFactory
  );

  assert.deepEqual(result, expectedReservation);
  assert.equal(result.status, 'confirmed');
});


test('rejects reservation when no seats are available', async () => {
  const mockClientFactory = () => ({
    rpc: async () => ({
      data: null,
      error: {
        code: 'P0001',
        message: 'no seats available'
      }
    })
  });

  await assert.rejects(
    reserve('test-token', 'trip-1', mockClientFactory),
    (error) => {
      assert.match(error.message, /no seats available/);
      return true;
    }
  );
});
