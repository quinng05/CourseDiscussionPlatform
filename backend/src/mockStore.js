function clonePosts() {
  return [
    {
      postId: 1,
      parentPostId: null,
      ratingId: 101,
      authorName: "Alex M.",
      anonymous: false,
      semester: "Fall 2024",
      score: 9,
      text: "One of the best CS courses at VT. Projects are well-designed and practical.",
      createdAt: "2024-12-10",
      replies: [
        {
          postId: 4,
          parentPostId: 1,
          ratingId: null,
          authorName: "Dr. Nizamani",
          anonymous: false,
          semester: null,
          score: null,
          text: "Thank you for the kind words!",
          createdAt: "2024-12-11",
          replies: [],
        },
        {
          postId: 5,
          parentPostId: 1,
          ratingId: null,
          authorName: "Sam K.",
          anonymous: false,
          semester: null,
          score: null,
          text: "Agreed — the ERD project especially.",
          createdAt: "2024-12-12",
          replies: [],
        },
      ],
    },
    {
      postId: 2,
      parentPostId: null,
      ratingId: 102,
      authorName: "Anonymous",
      anonymous: true,
      semester: "Spring 2025",
      score: 7,
      text: "Good course. Lectures dense but important. Start projects early.",
      createdAt: "2025-05-02",
      replies: [],
    },
    {
      postId: 3,
      parentPostId: null,
      ratingId: 103,
      authorName: "Jordan T.",
      anonymous: false,
      semester: "Fall 2024",
      score: 6,
      text: "Content is interesting but workload heavier than expected.",
      createdAt: "2024-12-15",
      replies: [
        {
          postId: 6,
          parentPostId: 3,
          ratingId: null,
          authorName: "Anonymous",
          anonymous: true,
          semester: null,
          score: null,
          text: "The normalization section was tough.",
          createdAt: "2024-12-16",
          replies: [],
        },
      ],
    },
  ];
}

const initialForums = [
  {
    id: 1,
    code: "CS4604",
    title: "Intro to Database Mgmt Systems",
    instructor: "Dr. Nizamani",
    avgRating: 4.6,
    ratingCount: 18,
  },
  {
    id: 2,
    code: "CS3214",
    title: "Computer Systems",
    instructor: "Dr. Luther",
    avgRating: 3.8,
    ratingCount: 31,
  },
  {
    id: 3,
    code: "CS4234",
    title: "Analysis of Algorithms",
    instructor: "Dr. Heath",
    avgRating: 4.1,
    ratingCount: 22,
  },
  {
    id: 4,
    code: "CS3744",
    title: "Introduction to GUI",
    instructor: "Dr. Shaffer",
    avgRating: 4.4,
    ratingCount: 14,
  },
  {
    id: 5,
    code: "MATH2114",
    title: "Linear Algebra",
    instructor: "Dr. Thomson",
    avgRating: 3.5,
    ratingCount: 40,
  },
  {
    id: 6,
    code: "CS4654",
    title: "Intro to Machine Learning",
    instructor: "Dr. Zhang",
    avgRating: 4.7,
    ratingCount: 9,
  },
];

let forums = initialForums.map((f) => ({ ...f }));
let nextForumId = 7;
const postsByForum = { 1: clonePosts() };

function ensurePosts(forumId) {
  const id = Number(forumId);
  if (!postsByForum[id]) postsByForum[id] = [];
  return postsByForum[id];
}

export function getForums() {
  return forums;
}

export function setForumsFromDb(rows) {
  forums = rows;
  nextForumId = forums.reduce((m, f) => Math.max(m, Number(f.id) || 0), 0) + 1;
}

export function addForum({ id: explicitId, code, title, instructor }) {
  let id;
  if (explicitId != null) {
    id = Number(explicitId);
    nextForumId = Math.max(nextForumId, id + 1);
  } else {
    id = nextForumId++;
  }
  const row = {
    id,
    code,
    title,
    instructor,
    avgRating: 0,
    ratingCount: 0,
  };
  forums = [row, ...forums];
  postsByForum[row.id] = [];
  return row;
}

export function updateForum(forumId, { code, title, instructor }) {
  const id = Number(forumId);
  const idx = forums.findIndex((f) => Number(f.id) === id);
  if (idx < 0) return null;
  forums[idx] = {
    ...forums[idx],
    code,
    title,
    instructor,
  };
  return forums[idx];
}

export function deleteForum(forumId) {
  const id = Number(forumId);
  const before = forums.length;
  forums = forums.filter((f) => Number(f.id) !== id);
  if (before === forums.length) return false;
  delete postsByForum[id];
  return true;
}

export function getPosts(forumId) {
  return ensurePosts(forumId);
}

function findPostInTree(posts, postId) {
  for (const p of posts) {
    if (p.postId === postId) return p;
    if (p.replies?.length) {
      const found = findPostInTree(p.replies, postId);
      if (found) return found;
    }
  }
  return null;
}

export function addReply(forumId, parentPostId, { authorName, text }) {
  const posts = ensurePosts(forumId);
  const parent = findPostInTree(posts, parentPostId);
  if (!parent) return null;
  if (!parent.replies) parent.replies = [];
  const newReply = {
    postId: Date.now(),
    parentPostId,
    ratingId: null,
    authorName,
    anonymous: false,
    semester: null,
    score: null,
    text,
    createdAt: new Date().toISOString().slice(0, 10),
    replies: [],
  };
  parent.replies.push(newReply);
  return newReply;
}

export function addTopLevelPost(forumId, payload) {
  const posts = ensurePosts(forumId);
  const row = {
    postId: Date.now(),
    parentPostId: null,
    ratingId: Date.now() + 1,
    authorName: payload.authorName,
    anonymous: payload.anonymous,
    semester: payload.semester,
    score: payload.score,
    text: payload.text,
    createdAt: new Date().toISOString().slice(0, 10),
    replies: [],
  };
  posts.unshift(row);
  return row;
}
