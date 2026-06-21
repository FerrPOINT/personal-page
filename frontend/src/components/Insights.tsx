import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Clock, ArrowUpRight } from 'lucide-react';
import { BlogPost } from '../types';
import Modal from './Modal';
import { useLanguage } from '../i18n/hooks/useLanguage';
import { getTranslatedBlogPosts, getCategoryMap } from '../i18n/utils/getTranslatedData';

function renderInlineMarkdown(text: string): React.ReactNode[] {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);

  return parts.map((part, index) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return (
        <strong key={index} className="font-semibold text-white">
          {part.slice(2, -2)}
        </strong>
      );
    }

    return <React.Fragment key={index}>{part}</React.Fragment>;
  });
}

function renderMarkdownContent(content: string): React.ReactNode[] {
  const lines = content.split('\n');
  const blocks: React.ReactNode[] = [];
  let paragraph: string[] = [];
  let listItems: string[] = [];

  const flushParagraph = () => {
    if (paragraph.length === 0) {
      return;
    }

    const text = paragraph.join(' ');
    blocks.push(
      <p key={`p-${blocks.length}`} className="text-gray-300 leading-8">
        {renderInlineMarkdown(text)}
      </p>
    );
    paragraph = [];
  };

  const flushList = () => {
    if (listItems.length === 0) {
      return;
    }

    blocks.push(
      <ul key={`ul-${blocks.length}`} className="list-disc space-y-3 pl-6 marker:text-accent-cyan">
        {listItems.map((item, index) => (
          <li key={index} className="text-gray-300 leading-7 pl-1">
            {renderInlineMarkdown(item)}
          </li>
        ))}
      </ul>
    );
    listItems = [];
  };

  lines.forEach((rawLine) => {
    const line = rawLine.trim();

    if (!line) {
      flushParagraph();
      flushList();
      return;
    }

    const headingMatch = line.match(/^\*\*(.+?)\*\*$/);
    if (headingMatch) {
      flushParagraph();
      flushList();
      blocks.push(
        <h2 key={`h-${blocks.length}`} className="pt-2 text-2xl font-bold text-white">
          {headingMatch[1]}
        </h2>
      );
      return;
    }

    if (line.startsWith('- ')) {
      flushParagraph();
      listItems.push(line.slice(2));
      return;
    }

    flushList();
    paragraph.push(line);
  });

  flushParagraph();
  flushList();

  return blocks;
}

const Insights: React.FC = () => {
  const { t, language } = useLanguage();
  const [selectedPost, setSelectedPost] = useState<BlogPost | null>(null);

  const blogPosts = useMemo(() => getTranslatedBlogPosts(language), [language]);
  const categoryMap = useMemo(() => getCategoryMap(language, t), [language, t]);

  return (
    <section id="insights" className="py-24 bg-background scroll-mt-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-12 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">{t('insights.title')}</h2>
          <div className="w-20 h-1 bg-gradient-to-r from-accent-cyan to-accent-magenta mx-auto"></div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {blogPosts.map((post, index) => (
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
                <span>{categoryMap[post.category] || post.category}</span>
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
                  {t('common.readArticle')}
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
        title={t('insights.modalTitle')}
      >
        {selectedPost && (
            <article className="prose prose-invert max-w-none">
                <div className="mb-6 pb-6 border-b border-white/10">
                    <span className="text-accent-magenta font-mono text-sm uppercase tracking-wider">{categoryMap[selectedPost.category] || selectedPost.category}</span>
                    <h1 className="text-3xl font-bold text-white mt-2 mb-4">{selectedPost.title}</h1>
                    <div className="flex items-center text-secondary text-sm">
                        <span>{selectedPost.date}</span>
                        <span className="mx-2">•</span>
                        <span>{selectedPost.readTime}</span>
                    </div>
                </div>
                <div className="space-y-6">
                    {renderMarkdownContent(selectedPost.content)}
                </div>
                
                <div className="mt-8 pt-6 border-t border-white/10 flex justify-between items-center">
                    <span className="text-sm text-secondary">{t('common.writtenBy')}</span>
                    <button onClick={() => setSelectedPost(null)} className="text-accent-cyan hover:underline text-sm font-medium">
                        {t('common.closeArticle')}
                    </button>
                </div>
            </article>
        )}
      </Modal>
    </section>
  );
};

export default Insights;

