'use cache';

import { cacheLife, cacheTag } from 'next/cache';

export const getHeavyData = async () => {
  cacheTag('heavy');
  cacheLife('hours');

  // Simulate heavy computation
  // await new Promise(resolve => setTimeout(resolve, 3000)) // 3 second delay

  const response = await fetch('https://jsonplaceholder.typicode.com/posts');
  const data = await response.json();

  // Make it bigger - duplicate data
  // const heavyData = Array(10).fill(data).flat() // 10,000 posts

  return data;
};
