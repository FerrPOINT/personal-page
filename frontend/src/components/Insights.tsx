import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Clock, ArrowUpRight } from 'lucide-react';
import { BLOG_POSTS } from '../constants';
import { BlogPost } from '../types';
import Modal from './Modal';

const Insights: React.FC = () => {
  const [selectedPost, setSelectedPost] = useState<BlogPost | null>(null);

  return (
    <section id="insights" className="py-24 bg-background scroll-mt-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-12 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">Architecture Insights</h2>
          <div className="w-20 h-1 bg-gradient-to-r from-accent-cyan to-accent-magenta mx-auto"></div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {BLOG_POSTS.map((post, index) => (
            <motion.article
              key={post.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              onClick={() => setSelectedPost(post)}
              className="flex flex-col h-full bg-surface border border-white/5 rounded-2xl p-6 hover:border-accent-magenta/30 transition-colors group cursor-pointer"
            >
              <div className="flex justify-between items-center mb-4 text-xs font-mono text-secondary uppercase tracking-wider">
                <span>{post.category}</span>
                <span>{post.date}</span>
              </div>
              
              <h3 className="text-xl font-bold text-white mb-3 group-hover:text-accent-magenta transition-colors">
                {post.title}
              </h3>
              
              <p className="text-gray-400 text-sm mb-6 flex-grow">
                {post.excerpt}
              </p>
              
              <div className="flex items-center justify-between mt-auto pt-6 border-t border-white/5">
                <div className="flex items-center text-xs text-gray-500">
                  <Clock className="w-3 h-3 mr-1" />
                  {post.readTime}
                </div>
                <div className="flex items-center text-sm font-bold text-white group-hover:text-accent-magenta transition-colors">
                  Read Article
                  <ArrowUpRight className="w-4 h-4 ml-1" />
                </div>
              </div>
            </motion.article>
          ))}
        </div>
      </div>

      <Modal
        isOpen={!!selectedPost}
        onClose={() => setSelectedPost(null)}
        title="Architecture Insights"
      >
        {selectedPost && (
            <article className="prose prose-invert max-w-none">
                <div className="mb-6 pb-6 border-b border-white/10">
                    <span className="text-accent-magenta font-mono text-sm uppercase tracking-wider">{selectedPost.category}</span>
                    <h1 className="text-3xl font-bold text-white mt-2 mb-4">{selectedPost.title}</h1>
                    <div className="flex items-center text-secondary text-sm">
                        <span>{selectedPost.date}</span>
                        <span className="mx-2">•</span>
                        <span>{selectedPost.readTime}</span>
                    </div>
                </div>
                <div className="text-gray-300 leading-relaxed whitespace-pre-line">
                    {selectedPost.content}
                </div>
                
                <div className="mt-8 pt-6 border-t border-white/10 flex justify-between items-center">
                    <span className="text-sm text-secondary">Written by Aleksandr Zhukov</span>
                    <button onClick={() => setSelectedPost(null)} className="text-accent-cyan hover:underline text-sm font-medium">
                        Close Article
                    </button>
                </div>
            </article>
        )}
      </Modal>
    </section>
  );
};

export default Insights;

