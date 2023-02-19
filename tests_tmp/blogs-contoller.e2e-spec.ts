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

describe('BlogsController (e2e)', () => {
  let app: INestApplication;
  let user1Id: string;
  let user2Id: string;
  let user3Id: string;
  let blog1Id: string;
  let blog2Id: string;
  let blog3Id: string;
  let post1Id: string;
  let post2Id: string;
  let post3Id: string;
  let blog1View: BlogViewModel;
  let blog2View: BlogViewModel;
  let blog3View: BlogViewModel;
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

  // ********[HOST]/blogs**********

  //preparation
  it('/testing/all-data (DELETE) clear DB', async () => {
    return request(app.getHttpServer()).delete('/testing/all-data').expect(204);
  });
  it('/sa/users (POST) add new user to the system', async () => {
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
  it('POST:[HOST]/auth/login: signIn users', async () => {
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
  });
  it('POST:[HOST]/blogger/blogs: create newBlogs', async () => {
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
  it('POST:[HOST]/blogger/blogs: create newPosts', async () => {
    const newPost1 = await request(app.getHttpServer())
      .post(`/blogger/blogs/${blog1Id}/posts`)
      .auth(accessTokenUser1, { type: 'bearer' })
      .send({
        title: 'title1',
        shortDescription: 'shortDescription1',
        content: 'content1',
      })
      .expect(201);
    post1Id = newPost1.body.id;
    const newPost2 = await request(app.getHttpServer())
      .post(`/blogger/blogs/${blog1Id}/posts`)
      .auth(accessTokenUser1, { type: 'bearer' })
      .send({
        title: 'title2',
        shortDescription: 'shortDescription2',
        content: 'content2',
      })
      .expect(201);
    post2Id = newPost2.body.id;
    const newPost3 = await request(app.getHttpServer())
      .post(`/blogger/blogs/${blog2Id}/posts`)
      .auth(accessTokenUser1, { type: 'bearer' })
      .send({
        title: 'title3',
        shortDescription: 'shortDescription3',
        content: 'content3',
      })
      .expect(201);
    post3Id = newPost3.body.id;
  });

  //GET:[HOST]/blogs
  it('GET:[HOST]/blogs: should return code 200 and array with 3 elements with default paginator', async () => {
    const blogs = await request(app.getHttpServer()).get('/blogs').expect(200);

    expect(blogs.body.totalCount).toBe(3);

    expect(blogs.body.items.length).toBe(3);

    expect(blogs.body.items[0]).toEqual({
      id: expect.any(String),
      name: 'blog3',
      description: 'description3',
      websiteUrl: 'https://youtube3.com',
      createdAt: expect.any(String),
      isMembership: false,
    });

    expect(blogs.body.items[1]).toEqual({
      id: expect.any(String),
      name: 'blog2',
      description: 'description2',
      websiteUrl: 'https://youtube2.com',
      createdAt: expect.any(String),
      isMembership: false,
    });
  });
  it('GET:[HOST]/blogs: should return code 200 and array with 3 elements with queryParams:sortDirection=asc', async () => {
    const blogs = await request(app.getHttpServer())
      .get('/blogs?sortDirection=asc')
      .expect(200);

    expect(blogs.body.totalCount).toBe(3);

    expect(blogs.body.items.length).toBe(3);

    expect(blogs.body.items[0]).toEqual({
      id: expect.any(String),
      name: 'blog1',
      description: 'description1',
      websiteUrl: 'https://youtube1.com',
      createdAt: expect.any(String),
      isMembership: false,
    });

    expect(blogs.body.items[1]).toEqual({
      id: expect.any(String),
      name: 'blog2',
      description: 'description2',
      websiteUrl: 'https://youtube2.com',
      createdAt: expect.any(String),
      isMembership: false,
    });
  });
  it('GET:[HOST]/blogs: should return code 200 and array with 1 elements with queryParams:pageSize=1&sortDirection=asc', async () => {
    const blogs = await request(app.getHttpServer())
      .get('/blogs?pageSize=1&sortDirection=asc')
      .expect(200);
    expect(blogs.body.items.length).toBe(1);

    expect(blogs.body.items[0]).toEqual({
      id: expect.any(String),
      name: 'blog1',
      description: 'description1',
      websiteUrl: 'https://youtube1.com',
      createdAt: expect.any(String),
      isMembership: false,
    });
  });
  it(
    'GET:[HOST]/blogs: should return code 200 and array with 1 elements with' +
      ' queryParams:pageNumber=2&pageSize=1&sortDirection=asc',
    async () => {
      const blogs = await request(app.getHttpServer())
        .get('/blogs?pageNumber=2&pageSize=1&sortDirection=asc')
        .expect(200);
      expect(blogs.body.items.length).toBe(1);

      expect(blogs.body.items[0]).toEqual({
        id: expect.any(String),
        name: 'blog2',
        description: 'description2',
        websiteUrl: 'https://youtube2.com',
        createdAt: expect.any(String),
        isMembership: false,
      });
    },
  );
  it('GET:[HOST]/blogs: should return code 200 and array with 1 elements with queryParams:searchNameTerm=g1', async () => {
    const blogs = await request(app.getHttpServer())
      .get('/blogs?searchNameTerm=g2')
      .expect(200);
    expect(blogs.body.items.length).toBe(1);

    expect(blogs.body.items[0]).toEqual({
      id: expect.any(String),
      name: 'blog2',
      description: 'description2',
      websiteUrl: 'https://youtube2.com',
      createdAt: expect.any(String),
      isMembership: false,
    });
  });

  //GET:[HOST]/blogs/{:id} - Returns blog by id
  it('GET:[HOST]/blogs/{:id}: should return code 404 for incorrect ID', async () => {
    await request(app.getHttpServer())
      .get('/blogs/qwe-ss---s-s-s-srty')
      .expect(404);
  });
  it('GET:[HOST]/blogs/{:id}: should return code 200 and equal blog for correct request', async () => {
    const blog = await request(app.getHttpServer())
      .get(`/blogs/${blog1Id}`)
      .expect(200);

    expect(blog.body).toEqual({
      id: expect.any(String),
      name: 'blog1',
      description: 'description1',
      websiteUrl: 'https://youtube1.com',
      createdAt: expect.any(String),
      isMembership: false,
    });
  });

  //GET:[HOST]/blogs/{:id}/posts - Returns all posts for specified blog
  it('GET:[HOST]/blogs/{:id}/posts: should return code 404 if id is wrong', async () => {
    const getPostsResult = await request(app.getHttpServer())
      .get(`/blogs/wrongId/posts`)
      .expect(404);
  });
  it('GET:[HOST]/blogs/{:id}/posts: should return code 200 and all posts for specified blog', async () => {
    const getPostsResult = await request(app.getHttpServer())
      .get(`/blogs/${blog1Id}/posts`)
      .expect(200);

    expect(getPostsResult.body.totalCount).toBe(2);

    expect(getPostsResult.body.items[1]).toEqual({
      id: expect.any(String),
      title: 'title1',
      shortDescription: 'shortDescription1',
      content: 'content1',
      blogId: blog1Id,
      blogName: blog1.name,
      createdAt: expect.any(String),
      extendedLikesInfo: {
        likesCount: 0,
        dislikesCount: 0,
        myStatus: 'None',
        newestLikes: [],
      },
    });
  });
});