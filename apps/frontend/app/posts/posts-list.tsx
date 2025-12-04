import { getHeavyData } from '@/lib/data/get-posts';
import PostCard from './post-card';

const PostsList = async () => {
  const posts = await getHeavyData();
  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
      {posts.map((post: any) => (
        <PostCard key={post.id} post={post} />
      ))}
    </div>
  );
};

export default PostsList;
