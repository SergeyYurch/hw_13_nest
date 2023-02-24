import { Test, TestingModule } from '@nestjs/testing';
import {
  BadRequestException,
  INestApplication,
  ValidationPipe,
} from '@nestjs/common';
import request from 'supertest';
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

describe('BloggerBlogController (e2e)', () => {
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
  let post4Id: string;
  let accessTokenUser1: string;
  let accessTokenUser2: string;
  let accessTokenUser3: string;

  afterAll(async () => {
    await disconnect();
    await app.close();
  });

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
      .send(user2);
    user2Id = newUser2.body.id;

    //create new user3
    const newUser3 = await request(app.getHttpServer())
      .post('/sa/users')
      .auth('admin', 'qwerty', { type: 'basic' })
      .send(user3);
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
  });

  //POST blogger/blogs - Create new blog (USER1 - is blogger)
  it('POST:[HOST]/blogger/blogs: should return code 401 "Unauthorized" for unauthorized request', async () => {
    await request(app.getHttpServer())
      .post('/blogger/blogs')
      .send(blog1)
      .expect(401);
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
    expect(newBlog3.body).toEqual({
      id: expect.any(String),
      name: 'blog3',
      websiteUrl: 'https://youtube3.com',
      description: 'description3',
      createdAt: expect.any(String),
      isMembership: false,
    });
  });
  it('POST:[HOST]/blogger/blogs: should return code 400 and error with field name for blog without name ', async () => {
    const newBlog1 = await request(app.getHttpServer())
      .post('/blogger/blogs')
      .auth(accessTokenUser1, { type: 'bearer' })
      .send({
        description: 'description1',
        websiteUrl: 'https://youtube1.com',
      })
      .expect(400);

    expect(newBlog1.body).toEqual({
      errorsMessages: [
        {
          message: expect.any(String),
          field: 'name',
        },
      ],
    });
  });
  it('POST:[HOST]/blogger/blogs: should return code 400 and error with field name for blog with long name ', async () => {
    const newBlog1 = await request(app.getHttpServer())
      .post('/blogger/blogs')
      .auth(accessTokenUser1, { type: 'bearer' })
      .send({
        name: '123456789123456789',
        description: 'description1',
        websiteUrl: 'https://youtube2.com',
      })
      .expect(400);

    expect(newBlog1.body).toEqual({
      errorsMessages: [
        {
          message: expect.any(String),
          field: 'name',
        },
      ],
    });
  });
  it('POST:[HOST]/blogger/blogs: should return code 400 and error with field name for blog with empty___ name ', async () => {
    const newBlog1 = await request(app.getHttpServer())
      .post('/blogger/blogs')
      .auth(accessTokenUser1, { type: 'bearer' })
      .send({
        name: '         ',
        description: 'description1',
        websiteUrl: 'https://youtube2.com',
      })
      .expect(400);

    expect(newBlog1.body).toEqual({
      errorsMessages: [
        {
          message: expect.any(String),
          field: 'name',
        },
      ],
    });
  });
  it('POST:[HOST]/blogger/blogs: should return code 400 and error with field websiteUrl for blog with incorrect websiteUrl ', async () => {
    const newBlog1 = await request(app.getHttpServer())
      .post('/blogger/blogs')
      .auth(accessTokenUser1, { type: 'bearer' })
      .send({
        name: 'name',
        description: 'description1',
        websiteUrl: 'youtube2.com',
      })
      .expect(400);

    expect(newBlog1.body).toEqual({
      errorsMessages: [
        {
          message: expect.any(String),
          field: 'websiteUrl',
        },
      ],
    });
  });
  it('POST:[HOST]/blogger/blogs: should return code 400 and error with field description for blog without description ', async () => {
    const newBlog1 = await request(app.getHttpServer())
      .post('/blogger/blogs')
      .auth(accessTokenUser1, { type: 'bearer' })
      .send({
        name: 'name',
        websiteUrl: 'https://youtube2.com',
      })
      .expect(400);

    expect(newBlog1.body).toEqual({
      errorsMessages: [
        {
          message: expect.any(String),
          field: 'description',
        },
      ],
    });
  });

  //GET:[HOST]/blogger/blogs -  Returns blogs (for which current user is owner) with paging Parameters
  it('GET:[HOST]/blogger/blogs: should return code 401 ', async () => {
    const user1Blogs = await request(app.getHttpServer())
      .get('/blogger/blogs?sortDirection=asc')
      .expect(401);
  });
  it('GET:[HOST]/blogger/blogs: should return code 200 and array with 3 elements with default paginator & sortDirection=asc', async () => {
    const user1Blogs = await request(app.getHttpServer())
      .get('/blogger/blogs?sortDirection=asc')
      .auth(accessTokenUser1, { type: 'bearer' })
      .expect(200);

    expect(user1Blogs.body.totalCount).toBe(3);
    expect(user1Blogs.body.items[0]).toEqual({
      id: expect.any(String),
      name: 'blog1',
      description: 'description1',
      websiteUrl: 'https://youtube1.com',
      createdAt: expect.any(String),
      isMembership: false,
    });

    expect(user1Blogs.body.items[1]).toEqual({
      id: expect.any(String),
      name: 'blog2',
      description: 'description2',
      websiteUrl: 'https://youtube2.com',
      createdAt: expect.any(String),
      isMembership: false,
    });
  });
  it('GET:[HOST]/blogger/blogs: should return code 200 and array with 0 elements with default paginator for user2', async () => {
    const user2Blogs = await request(app.getHttpServer())
      .get('/blogger/blogs?sortDirection=asc')
      .auth(accessTokenUser2, { type: 'bearer' })
      .expect(200);

    expect(user2Blogs.body.totalCount).toBe(0);
  });
  it('GET:[HOST]/blogger/blogs: should return code 200 and array with 1 elements with queryParams:pageSize=1&sortDirection=asc', async () => {
    const blogs = await request(app.getHttpServer())
      .get('/blogger/blogs?pageSize=1&sortDirection=asc')
      .auth(accessTokenUser1, { type: 'bearer' })
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
  it('GET:[HOST]/blogger/blogs: should return code 200 and array with 1 elements with queryParams:searchNameTerm=g2', async () => {
    const blogs = await request(app.getHttpServer())
      .get('/blogger/blogs?searchNameTerm=g2')
      .auth(accessTokenUser1, { type: 'bearer' })
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

  //DELETE:[HOST]/blogger/blogs/{:id}: - delete blog1 by ID
  it('DELETE:[HOST]/blogger/blogs/{:id}: should return code 401 "Unauthorized" for unauthorized request', async () => {
    await request(app.getHttpServer()).delete('/blogger/blogs/1').expect(401);
  });
  it('DELETE:[HOST]/blogger/blogs/{:id}: should return code 404 for incorrect ID', async () => {
    await request(app.getHttpServer())
      .delete('/blogger/blogs/qwerty')
      .auth(accessTokenUser1, { type: 'bearer' })
      .expect(404);
  });
  it('DELETE:[HOST]/blogger/blogs/{:id}: should return code 403- Forbidden if user3 tries delete a blog that was created user1', async () => {
    await request(app.getHttpServer())
      .delete(`/blogger/blogs/${blog1Id}`)
      .auth(accessTokenUser3, { type: 'bearer' })
      .expect(403);
  });
  it('DELETE:[HOST]/blogger/blogs/{:id}: should return code 204 for correct request, and should return 404 for GET by id', async () => {
    await request(app.getHttpServer())
      .delete(`/blogger/blogs/${blog1Id}`)
      .auth(accessTokenUser1, { type: 'bearer' })
      .expect(204);

    const blogs = await request(app.getHttpServer())
      .get('/blogger/blogs')
      .auth(accessTokenUser1, { type: 'bearer' })
      .expect(200);

    expect(blogs.body.totalCount).toBe(2);
  });

  //PUT:[HOST]/blogger/blogs/{:id} - edit blog2
  it('PUT:[HOST]/blogger/blogs/{:id}: should return code 401 "Unauthorized" for unauthorized request', async () => {
    await request(app.getHttpServer())
      .put(`/blogger/blogs/${blog2Id}`)
      .expect(401);
  });
  it('PUT:[HOST]/blogger/blogs/{:id}: should return code 403 Forbidden if user3 tries edit a blog that was created user1', async () => {
    await request(app.getHttpServer())
      .put(`/blogger/blogs/${blog2Id}`)
      .auth(accessTokenUser3, { type: 'bearer' })
      .send({
        name: 'blog5',
        description: 'description-edit',
        websiteUrl: 'https://youtube5.com',
      })
      .expect(403);
  });
  it('PUT:[HOST]/blogger/blogs/{:id}: should return code 204 correct input data', async () => {
    await request(app.getHttpServer())
      .put(`/blogger/blogs/${blog2Id}`)
      .auth(accessTokenUser1, { type: 'bearer' })
      .send({
        name: 'blog5',
        description: 'description-edit',
        websiteUrl: 'https://youtube5.com',
      })
      .expect(204);
    const changedBlog = await request(app.getHttpServer()).get(
      `/blogs/${blog2Id}`,
    );
    expect(changedBlog.body).toEqual({
      id: expect.any(String),
      name: 'blog5',
      description: 'description-edit',
      websiteUrl: 'https://youtube5.com',
      createdAt: expect.any(String),
      isMembership: false,
    });
  });
  it('PUT:[HOST]/blogger/blogs/{:id}: should return code 404 for incorrect ID', async () => {
    await request(app.getHttpServer())
      .put(`/blogger/blogs/3333333333333`)
      .auth(accessTokenUser1, { type: 'bearer' })
      .send({
        name: 'blog5',
        description: 'description-edit',
        websiteUrl: 'https://youtube5.com',
      })
      .expect(404);
  });
  it('PUT:[HOST]/blogger/blogs/{:id}: should return code 400 for incorrect input data', async () => {
    await request(app.getHttpServer())
      .put(`/blogger/blogs/${blog2Id}`)
      .auth(accessTokenUser1, { type: 'bearer' })
      .send({
        name: 'blog5',
        description: 'description-edit',
        websiteUrl: 'youtube5.com',
      })
      .expect(400);
  });

  //POST:[HOST]/blogger/blogs/{:blogId}/posts  - Create new post for blog3
  it('POST:[HOST]/blogger/blogs/{:blogId}/posts: should return code 401 "Unauthorized" for unauthorized request', async () => {
    await request(app.getHttpServer())
      .post(`/blogger/blogs/${blog2Id}/posts`)
      .send({
        title: 'title1',
        shortDescription: 'shortDescription1',
        content: 'content1',
      })
      .expect(401);
  });
  it("POST:[HOST]/blogger/blogs/{:blogId}/posts: should return code 403 if user try to add post to blog that doesn't belong to current user", async () => {
    await request(app.getHttpServer())
      .post(`/blogger/blogs/${blog3Id}/posts`)
      .auth(accessTokenUser2, { type: 'bearer' })
      .send({
        title: 'title1',
        shortDescription: 'shortDescription1',
        content: 'content1',
      })
      .expect(403);
  });
  it("POST:[HOST]/blogger/blogs/{:blogId}/posts: should return code 404 if specific blog doesn't exists", async () => {
    await request(app.getHttpServer())
      .post(`/blogger/blogs/${blog1Id}/posts`)
      .auth(accessTokenUser2, { type: 'bearer' })
      .send({
        title: 'title1',
        shortDescription: 'shortDescription1',
        content: 'content1',
      })
      .expect(404);
  });
  it('POST:[HOST]/blogger/blogs/{:blogId}/posts: should return code 400 if the inputModel has incorrect values', async () => {
    const newPost1 = await request(app.getHttpServer())
      .post(`/blogger/blogs/${blog3Id}/posts`)
      .auth(accessTokenUser1, { type: 'bearer' })
      .send({
        title: 'title1',
        shortDescription: 'shortDescription1',
      })
      .expect(400);
  });
  it('POST:[HOST]/blogger/blogs/{:blogId}/posts: should return code 201 and newPost for correct input data', async () => {
    const newPost1 = await request(app.getHttpServer())
      .post(`/blogger/blogs/${blog3Id}/posts`)
      .auth(accessTokenUser1, { type: 'bearer' })
      .send({
        title: 'title1',
        shortDescription: 'shortDescription1',
        content: 'content1',
      })
      .expect(201);
    post1Id = newPost1.body.id;

    expect(newPost1.body).toEqual({
      id: expect.any(String),
      title: 'title1',
      shortDescription: 'shortDescription1',
      content: 'content1',
      blogId: blog3Id,
      blogName: blog3.name,
      createdAt: expect.any(String),
      extendedLikesInfo: {
        likesCount: 0,
        dislikesCount: 0,
        myStatus: 'None',
        newestLikes: [],
      },
    });

    const newPost2 = await request(app.getHttpServer())
      .post(`/blogger/blogs/${blog3Id}/posts`)
      .auth(accessTokenUser1, { type: 'bearer' })
      .send({
        title: 'title2',
        shortDescription: 'shortDescription2',
        content: 'content2',
      })
      .expect(201);
    post2Id = newPost2.body.id;
  });

  //PUT:[HOST]/blogger/blogs/posts/{:postId}  - edit post
  it('PUT:[HOST]/blogger/blogs/posts/{:postId} : should return code 401 "Unauthorized" for unauthorized request', async () => {
    const newPost1 = await request(app.getHttpServer())
      .put(`/blogger/blogs/${blog3Id}/posts/${post1Id}`)
      .send({
        title: 'title1',
        shortDescription: 'shortDescription1',
        content: 'content1',
      })
      .expect(401);
  });
  it('PUT:[HOST]/blogger/blogs/posts/{:postId} : should return code  403 Forbidden if user3 tries edit a post that was created user1', async () => {
    const editPost1 = await request(app.getHttpServer())
      .put(`/blogger/blogs/${blog3Id}/posts/${post1Id}`)
      .auth(accessTokenUser2, { type: 'bearer' })
      .send({
        title: 'title1-edit',
        shortDescription: 'shortDescription1-edit',
        content: 'content1-edit',
      })
      .expect(403);
  });
  it('PUT:[HOST]/blogger/blogs/posts/{:postId} : should return code  404 Not Found if postId is incorrect', async () => {
    const editPost1 = await request(app.getHttpServer())
      .put(`/blogger/blogs/${blog3Id}/posts/111111111111`)
      .auth(accessTokenUser2, { type: 'bearer' })
      .send({
        title: 'title1-edit',
        shortDescription: 'shortDescription1-edit',
        content: 'content1-edit',
      })
      .expect(404);
  });
  it('PUT:[HOST]/blogger/blogs/posts/{:postId} : should return code  404 Not Found if blogId is incorrect', async () => {
    const editPost1 = await request(app.getHttpServer())
      .put(`/blogger/blogs/33333333333/posts/${post1Id}`)
      .auth(accessTokenUser2, { type: 'bearer' })
      .send({
        title: 'title1-edit',
        shortDescription: 'shortDescription1-edit',
        content: 'content1-edit',
      })
      .expect(404);
  });
  it('PUT:[HOST]/blogger/blogs/posts/{:postId} : should return code 204 for correct input data', async () => {
    const editPost1 = await request(app.getHttpServer())
      .put(`/blogger/blogs/${blog3Id}/posts/${post1Id}`)
      .auth(accessTokenUser1, { type: 'bearer' })
      .send({
        title: 'title1-edit',
        shortDescription: 'shortDescription1-edit',
        content: 'content1-edit',
      })
      .expect(204);
  });

  //DELETE:[HOST]/blogger/blogs/posts/{:postId} delete Blog3
  it('DELETE:[HOST]/blogger/blogs/posts/{:postId} : should return code 401 "Unauthorized" for unauthorized request', async () => {
    const newPost1 = await request(app.getHttpServer())
      .delete(`/blogger/blogs/${blog3Id}/posts/${post1Id}`)
      .expect(401);
  });
  it('DELETE:[HOST]/blogger/blogs/posts/{:postId} : should return code  403 Forbidden if user3 tries edit a post that was created user1', async () => {
    const editPost1 = await request(app.getHttpServer())
      .delete(`/blogger/blogs/${blog3Id}/posts/${post1Id}`)
      .auth(accessTokenUser2, { type: 'bearer' })
      .expect(403);
  });
  it('DELETE:[HOST]/blogger/blogs/posts/{:postId} : should return code  404 Not Found if postId is incorrect', async () => {
    const editPost1 = await request(app.getHttpServer())
      .delete(`/blogger/blogs/${blog3Id}/posts/111111111111`)
      .auth(accessTokenUser2, { type: 'bearer' })
      .expect(404);
  });
  it('DELETE:[HOST]/blogger/blogs/posts/{:postId} : should return code  404 Not Found if blogId is incorrect', async () => {
    const editPost1 = await request(app.getHttpServer())
      .delete(`/blogger/blogs/33333333333/posts/${post1Id}`)
      .auth(accessTokenUser2, { type: 'bearer' })
      .expect(404);
  });
  it('DELETE:[HOST]/blogger/blogs/posts/{:postId} : should return code 204 for correct input data', async () => {
    const editPost1 = await request(app.getHttpServer())
      .delete(`/blogger/blogs/${blog3Id}/posts/${post1Id}`)
      .auth(accessTokenUser1, { type: 'bearer' })
      .expect(204);

    await request(app.getHttpServer())
      .put(`/blogger/blogs/${blog3Id}/posts/${post1Id}`)
      .auth(accessTokenUser1, { type: 'bearer' })
      .send({
        title: 'title1-edit',
        shortDescription: 'shortDescription1-edit',
        content: 'content1-edit',
      })
      .expect(404);
  });

  //GET:[HOST]/blogger/blogs/comments -  Returns all comments for all posts inside all current user blogs
  //additional data preparation...
  it('POST:[HOST]/blogger/blogs: user1 create post4 for blog2', async () => {
    const newPost4 = await request(app.getHttpServer())
      .post(`/blogger/blogs/${blog2Id}/posts`)
      .auth(accessTokenUser1, { type: 'bearer' })
      .send({
        title: 'title4',
        shortDescription: 'shortDescription4',
        content: 'content4',
      })
      .expect(201);
    post4Id = newPost4.body.id;
  });
  it('POST: [HOST]/posts/{:postId}/comments - User2 & User3 create comment for blog2/post4', async () => {
    await request(app.getHttpServer())
      .post(`/posts/${post4Id}/comments`)
      .auth(accessTokenUser2, { type: 'bearer' })
      .send({
        content: 'User2 create comment: comment',
      })
      .expect(201);

    await request(app.getHttpServer())
      .post(`/posts/${post4Id}/comments`)
      .auth(accessTokenUser3, { type: 'bearer' })
      .send({
        content: 'User3 create comment: comment',
      })
      .expect(201);
  });

  //main tests
  it('GET:[HOST]/blogger/blogs/comments: should return code 401 ', async () => {
    const user1Blogs = await request(app.getHttpServer())
      .get('/blogger/blogs/comments')
      .expect(401);
  });
  it('GET:[HOST]/blogger/blogs/comments: should return code 200 and array with 2 elements with default paginator', async () => {
    const user1Blogs = await request(app.getHttpServer())
      .get('/blogger/blogs/comments')
      .auth(accessTokenUser1, { type: 'bearer' })
      .expect(200);

    expect(user1Blogs.body.totalCount).toBe(2);
    expect(user1Blogs.body.items[0]).toEqual({
      id: expect.any(String),
      content: 'User3 create comment: comment',
      commentatorInfo: {
        userId: user3Id,
        userLogin: 'user3',
      },
      createdAt: expect.any(String),
      postInfo: {
        id: post4Id,
        title: 'title4',
        blogId: blog2Id,
        blogName: 'blog5',
      },
    });
    expect(user1Blogs.body.items[1].commentatorInfo.userId).toBe(user2Id);
  });
  it('GET:[HOST]/blogger/blogs/comments: should return code 200 and array with 2 elements with queryParams:pageSize=1&sortDirection=asc', async () => {
    const user1Blogs = await request(app.getHttpServer())
      .get('/blogger/blogs/comments?pageSize=1&sortDirection=asc')
      .auth(accessTokenUser1, { type: 'bearer' })
      .expect(200);

    expect(user1Blogs.body.totalCount).toBe(2);
    expect(user1Blogs.body.items[0].commentatorInfo.userId).toBe(user2Id);
    expect(user1Blogs.body.items[1]).toBeUndefined();
  });
});
