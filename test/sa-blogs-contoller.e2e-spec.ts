import { Test, TestingModule } from '@nestjs/testing';
import {
  BadRequestException,
  INestApplication,
  ValidationPipe,
} from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { disconnect } from 'mongoose';
import { useContainer } from 'class-validator';
import { HttpExceptionFilter } from '../src/common/exception-filters/http-exception.filter';
import { BlogViewModel } from '../src/blogs/dto/view-models/blog.view.model';

const user1 = {
  login: 'user1',
  password: 'password1',
  email: 'email1@gmail.com',
};
const user2 = {
  login: 'user2',
  password: 'password2',
  email: 'email2@gmail.com',
};
const user3 = {
  login: 'user3',
  password: 'password3',
  email: 'email3@gmail.com',
};
const blog1 = {
  name: 'blog1',
  description: 'description1',
  websiteUrl: 'https://youtube1.com',
};
const blog2 = {
  name: 'blog2',
  description: 'description2',
  websiteUrl: 'https://youtube2.com',
};
const blog3 = {
  name: 'blog3',
  description: 'description3',
  websiteUrl: 'https://youtube3.com',
};

describe('UsersController (e2e)', () => {
  let app: INestApplication;
  let user1Id: string;
  let user2Id: string;
  let user3Id: string;
  let blog1Id: string;
  let blog2Id: string;
  let blog3Id: string;
  let blog1View: BlogViewModel;
  let blog2View: BlogViewModel;
  let blog3View: BlogViewModel;
  let post1Id: string;
  let post2Id: string;
  let post3Id: string;
  let accessTokenUser1: string;
  let accessTokenUser2: string;
  let accessTokenUser3: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    useContainer(app.select(AppModule), { fallbackOnErrors: true });
    app.useGlobalPipes(
      new ValidationPipe({
        stopAtFirstError: true,
        transform: true,
        exceptionFactory: (errors) => {
          const errorsForResponse = [];
          for (const e of errors) {
            const key = Object.keys(e.constraints)[0];
            errorsForResponse.push({
              message: e.constraints[key],
              field: e.property,
            });
          }
          throw new BadRequestException(errorsForResponse);
        },
      }),
    );
    app.useGlobalFilters(new HttpExceptionFilter());

    await app.init();
  });

  afterAll(async () => {
    await disconnect();
    await app.close();
  });
  // ********[HOST]/sa/blogs**********

  //preparation
  it('/testing/all-data (DELETE) clear DB', async () => {
    return request(app.getHttpServer()).delete('/testing/all-data').expect(204);
  });
  it('/sa/users (POST) Add new user to the system. Should return 201 and add new user to db', async () => {
    //create new user2
    const newUser1 = await request(app.getHttpServer())
      .post('/sa/users')
      .auth('admin', 'qwerty', { type: 'basic' })
      .send(user1)
      .expect(201);
    user1Id = newUser1.body.id;
    //create new user2
    const newUser2 = await request(app.getHttpServer())
      .post('/sa/users')
      .auth('admin', 'qwerty', { type: 'basic' })
      .send(user2)
      .expect(201);
    user2Id = newUser2.body.id;

    //create new user3
    const newUser3 = await request(app.getHttpServer())
      .post('/sa/users')
      .auth('admin', 'qwerty', { type: 'basic' })
      .send(user3)
      .expect(201);
    user3Id = newUser3.body.id;
  });
  it('POST:[HOST]/auth/login: should return code 200 and JWT-tokens if user signIn', async () => {
    const sigInUser1 = await request(app.getHttpServer())
      .post('/auth/login')
      .send({
        loginOrEmail: 'user1',
        password: 'password1',
      })
      .expect(200);
    accessTokenUser1 = sigInUser1.body.accessToken;

    const sigInUser2 = await request(app.getHttpServer())
      .post('/auth/login')
      .send({
        loginOrEmail: 'user2',
        password: 'password2',
      })
      .expect(200);
    accessTokenUser2 = sigInUser2.body.accessToken;

    const sigInUser3 = await request(app.getHttpServer())
      .post('/auth/login')
      .send({
        loginOrEmail: 'user3',
        password: 'password3',
      })
      .expect(200);
    accessTokenUser3 = sigInUser3.body.accessToken;
    app.getHttpServer().close();
  });
  it('POST:[HOST]/sa/blogs: should return code 201 and newBlog for correct input data', async () => {
    //create blog without owner for tests
    const newBlog1 = await request(app.getHttpServer())
      .post('/sa/blogs')
      .auth('admin', 'qwerty', { type: 'basic' })
      .send(blog1)
      .expect(201);
    blog1View = newBlog1.body;
    blog1Id = newBlog1.body.id;
    const getBlogResult1 = await request(app.getHttpServer())
      .get(`/blogs/${blog1Id}`)
      .expect(200);
    expect(getBlogResult1.body).toEqual({
      id: expect.any(String),
      name: 'blog1',
      websiteUrl: 'https://youtube1.com',
      description: 'description1',
      createdAt: expect.any(String),
      isMembership: false,
    });
  });

  //GET: [HOST]/sa/blogs
  it('GET: [HOST]/sa/blogs/ should return code 201 and all blogs with pagination in sa.BlogViewModel type', async () => {
    const getBlogsResult = await request(app.getHttpServer())
      .get(`/sa/blogs`)
      .auth('admin', 'qwerty', { type: 'basic' });
    const blog1InDb = getBlogsResult.body.items[0];
    expect(blog1InDb.blogOwnerInfo).toBeUndefined();
  });

  // PUT: [HOST]sa/blogs/{id}/bind-with-user/{userId} Bind Blog with user
  it('PUT: [HOST]/sa/blogs/{:id}/bind-with-user/{:userId} should return code 401 for unauthorized user', async () => {
    await request(app.getHttpServer())
      .put(`/sa/blogs/${blog1Id}/bind-with-user/${user1Id}`)
      .expect(401);
  });
  it('PUT: [HOST]/sa/blogs/{:id}/bind-with-user/{:userId}: should return code 204 for correct userId and user should be bound', async () => {
    await request(app.getHttpServer())
      .put(`/sa/blogs/${blog1Id}/bind-with-user/${user1Id}`)
      .auth('admin', 'qwerty', { type: 'basic' })
      .expect(204);

    const getBlogsResult = await request(app.getHttpServer())
      .get(`/sa/blogs`)
      .auth('admin', 'qwerty', { type: 'basic' });
    const blog1InDb = getBlogsResult.body.items[0];
    //check userId in blogOwnerInfo
    expect(blog1InDb.blogOwnerInfo.userId).toBe(user1Id);
  });
  it('PUT: [HOST]/sa/blogs/{:id}/bind-with-user/{:userId}: should return code 400 if the blog already bound to any user', async () => {
    await request(app.getHttpServer())
      .put(`/sa/blogs/${blog1Id}/bind-with-user/${user1Id}`)
      .auth('admin', 'qwerty', { type: 'basic' })
      .expect(400);
  });

  //GET: [HOST]/sa/blogs
  it('DELETE:[HOST]/blogger/blogs/{:id}: should return code 204 for correct request, and should return 404 for GET by id', async () => {
    await request(app.getHttpServer())
      .delete(`/blogger/blogs/${blog1Id}`)
      .auth(accessTokenUser1, { type: 'bearer' })
      .expect(204);
  });
  it('POST:[HOST]/blogger/blogs: should return code 201 and newBlog for correct input data', async () => {
    const newBlog1 = await request(app.getHttpServer())
      .post('/blogger/blogs')
      .auth(accessTokenUser1, { type: 'bearer' })
      .send(blog1)
      .expect(201);
    blog1View = newBlog1.body;
    blog1Id = newBlog1.body.id;

    const newBlog2 = await request(app.getHttpServer())
      .post('/blogger/blogs')
      .auth(accessTokenUser1, { type: 'bearer' })
      .send(blog2)
      .expect(201);
    blog2View = newBlog2.body;
    blog2Id = newBlog2.body.id;

    const newBlog3 = await request(app.getHttpServer())
      .post('/blogger/blogs')
      .auth(accessTokenUser1, { type: 'bearer' })
      .send(blog3)
      .expect(201);
    blog3View = newBlog3.body;
    blog3Id = newBlog3.body.id;
  });

  //checking pagination

  it('GET: [HOST]/sa/blogs/ should return code 201 and all blogs with sortDirection=asc', async () => {
    const getBlogsResult = await request(app.getHttpServer())
      .get(`/sa/blogs?sortDirection=asc`)
      .auth('admin', 'qwerty', { type: 'basic' });
    expect(getBlogsResult.body.items[0].name).toBe('blog1');
  });
  it('GET: [HOST]/sa/blogs/ should return code 201 and  blog2 if query has searchNameTerm = og2', async () => {
    const getBlogsResult = await request(app.getHttpServer())
      .get(`/sa/blogs?searchNameTerm=og2`)
      .auth('admin', 'qwerty', { type: 'basic' });
    expect(getBlogsResult.body.items[0]?.name).toBe('blog2');
  });
});