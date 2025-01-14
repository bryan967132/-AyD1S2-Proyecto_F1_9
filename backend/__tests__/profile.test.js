import request from 'supertest'
import app from '../index.test.mjs'

test('POST /uploadProfile, debe retornar un atributo status=200, icon, message', async () => {
    const res = await request(app).post('/uploadProfile').send({ ID_USUARIO: 2, changes: {NOMBRE: 'Steven', APELLIDO: 'Gonzalez'}})
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('status', 200);
    expect(res.body).toHaveProperty('icon');
    expect(res.body).toHaveProperty('message');
}, 30000)