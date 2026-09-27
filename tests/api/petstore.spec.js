const { test, expect } = require('@playwright/test');

// Bonus: API tests for Swagger Petstore (same scenarios as Part 4 in Postman).
// Every test creates its own pet with a unique ID and deletes it afterwards,
// so tests are independent and leave no data on the shared server.

function buildPet(id) {
  return {
    id,
    category: { id: 1, name: 'Dogs' },
    name: `Playwright_Dog_${id}`,
    photoUrls: ['https://example.com/dog.jpg'],
    tags: [{ id: 1, name: 'playwright' }],
    status: 'available',
  };
}

test.describe('Petstore API: /pet', () => {
  /** @type {ReturnType<typeof buildPet>} */
  let pet;

  test.beforeEach(async ({ request }) => {
    // Unique ID within the safe integer range.
    pet = buildPet(Date.now() * 1000 + Math.floor(Math.random() * 1000));

    const response = await request.post('pet', { data: pet });
    expect(response.status()).toBe(200);
  });

  test.afterEach(async ({ request }) => {
    // Postcondition: remove test data. 404 is fine if the test already deleted the pet.
    const response = await request.delete(`pet/${pet.id}`);
    expect([200, 404]).toContain(response.status());
  });

  test('API-01 created pet can be retrieved with the same data', async ({ request }) => {
    const response = await request.get(`pet/${pet.id}`);

    expect(response.status()).toBe(200);
    expect(await response.json()).toEqual(pet);
  });

  test('API-02 update changes name and status and keeps other fields', async ({ request }) => {
    const updated = { ...pet, name: `${pet.name}_Updated`, status: 'sold' };

    const updateResponse = await request.put('pet', { data: updated });
    expect(updateResponse.status()).toBe(200);
    expect(await updateResponse.json()).toEqual(updated);

    // The update must be saved on the server, not only returned in the response.
    const getResponse = await request.get(`pet/${pet.id}`);
    expect(getResponse.status()).toBe(200);
    const saved = await getResponse.json();
    expect(saved.name).toBe(updated.name);
    expect(saved.status).toBe('sold');
    expect(saved.category).toEqual(pet.category);
    expect(saved.tags).toEqual(pet.tags);
    expect(saved.photoUrls).toEqual(pet.photoUrls);
  });

  test('API-03 deleted pet is no longer available (negative)', async ({ request }) => {
    const deleteResponse = await request.delete(`pet/${pet.id}`);
    expect(deleteResponse.status()).toBe(200);
    expect((await deleteResponse.json()).message).toBe(String(pet.id));

    const getResponse = await request.get(`pet/${pet.id}`);
    expect(getResponse.status()).toBe(404);
    expect((await getResponse.json()).message).toBe('Pet not found');
  });
});
