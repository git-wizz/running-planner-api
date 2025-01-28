import { RequestLogger } from 'testcafe';

const apiUrl = 'http://localhost:3000';

// Logger to track requests and responses
const logger = RequestLogger({ logResponseBody: true, stringifyResponseBody: true });

fixture('Running Planner API Tests')
    .page(apiUrl)
    .requestHooks(logger);

test('Fetch all runs (GET /runs)', async t => {
    const response = await t.request(`${apiUrl}/runs`);

    await t.expect(response.status).eql(200, 'Status code should be 200');
    await t.expect(Array.isArray(response.body)).ok('Response should be an array');
    await t.expect(response.body.length).gt(0, 'There should be at least one run');
});

test('Fetch a specific run (GET /runs/:id)', async t => {
    const runId = 13; 
    const response = await t.request(`${apiUrl}/runs/${runId}`);

    await t.expect(response.status).eql(200, 'Status code should be 200');
    await t.expect(response.body).notEql(null, 'Response should not be null');
    await t.expect(response.body).contains({ id: runId }, 'Response should contain the requested run ID');
});

test('Add a new run (POST /runs)', async t => {
    const newRun = {
        date: '2023-12-01',
        distance: 5.0,
        pace: '6:30',
        notes: 'Morning jog'
    };

    const response = await t.request.post(`${apiUrl}/runs`, { body: newRun });

    await t.expect(response.status).eql(201, 'Status code should be 201');
    await t.expect(response.body).contains(newRun, 'Response should contain the newly created run');
    await t.expect(response.body.id).typeOf('number', 'The ID should be a number');
});

test('Update a run (PUT /runs/:id)', async t => {
    const runId = 11; 
    const updatedRun = {
        date: '2022-02-19',
        distance: 4.0,
        pace: '7:00',
        notes: 'Tempo run.'
    };

    const response = await t.request.put(`${apiUrl}/runs/${runId}`, { body: updatedRun });

    await t.expect(response.status).eql(200, 'Status code should be 200');
    await t.expect(response.body).contains(updatedRun, 'Response should contain the updated run details');
    await t.expect(response.body.id).eql(runId, 'The ID should match the updated run');
});

test('Delete a run (DELETE /runs/:id)', async t => {
    const runId = 10;
    const response = await t.request.delete(`${apiUrl}/runs/${runId}`);

    await t.expect(response.status).eql(204, 'Status code should be 204');
    
    // Verify that the deleted run no longer exists
    const fetchResponse = await t.request(`${apiUrl}/runs/${runId}`);
    await t.expect(fetchResponse.status).eql(404, 'The run should not exist after deletion');
});

test('Filter runs by slower pace (GET /runs/filter?type=pace&value=07:00)', async t => {
    const response = await t.request(`${apiUrl}/runs/filter?type=pace&value=7:00`);

    await t.expect(response.status).eql(200, 'Status code should be 200');
    await t.expect(Array.isArray(response.body)).ok('Response should be an array');
    for (const run of response.body) {
        await t.expect(run.pace > '7:00').ok('Run pace should be slower than the threshold');
    }
});

test('Filter runs by lesser distance (GET /runs/filter?type=distance&value=5)', async t => {
    const response = await t.request(`${apiUrl}/runs/filter?type=distance&value=5`);

    await t.expect(response.status).eql(200, 'Status code should be 200');
    await t.expect(Array.isArray(response.body)).ok('Response should be an array');
    for (const run of response.body) {
        await t.expect(run.distance < 5).ok('Run distance should be less than the threshold');
    }
});