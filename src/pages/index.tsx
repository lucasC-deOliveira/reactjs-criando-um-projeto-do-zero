import { GetStaticProps } from 'next';

import { getPrismicClient } from '../services/prismic';

import commonStyles from '../styles/common.module.scss';
import styles from './home.module.scss';
import Header from "../components/Header"
import Link from "next/link"
import { ptBR } from 'date-fns/locale';
import { format } from 'date-fns';
import { FiCalendar, FiUser } from "react-icons/fi"
import { useState } from 'react';
import Head from 'next/head';


interface Post {
  uid?: string;
  first_publication_date: string | null;
  data: {
    title: string;
    subtitle: string;
    author: string;
  };
}

interface PostPagination {
  next_page: string;
  results: Post[];
}

interface HomeProps {
  postsPagination: PostPagination;
}

export default function Home({ postsPagination }: HomeProps): JSX.Element {
  // TODO

  const formattedPosts = postsPagination.results.map(post => {
    return {
      ...post,
      first_publication_date: format(new Date(post.first_publication_date),
        "d LLL yyyy",
        {
          locale: ptBR
        }),
    }
  })

  const [posts, setPosts] = useState<Post[]>(formattedPosts)

  const [nextPage, setNextPage] = useState(postsPagination.next_page)

  const [currentPage, setCurrentPage] = useState(1)

  async function handleNextPage(): Promise<void> {
    if (currentPage !== 1 && nextPage === null) {
      return
    }

    const results = await fetch(`${nextPage}`)
      .then(response => response.json())

    setNextPage(results.next_page)
    setCurrentPage(results.page)

    const newPosts = results.results.map(post => {
      return {
        uid: post.uid,
        first_publication_date: format(new Date(post.first_publication_date),
          "d LLL yyyy",
          {
            locale: ptBR
          }),
        data: {
          title: post.data.title,
          subtitle: post.data.subtitle,
          author: post.data.author,

        }
      }
    }
    )

    setPosts([...posts, ...newPosts])
  }

  return (
    <>
      <Head>
        <title>Home | Spacetraveling</title>
      </Head>
      <Header />
      <main className={commonStyles.container}>
        <div className={styles.posts}>
          {posts.map(post => (
            <Link href={`/post/${post.uid}`} key={post.uid}>
              <a className={styles.post}>
                <strong>
                  {post.data.title}
                </strong>
                <p>
                  {post.data.subtitle}
                </p>
                <ul>
                  <li>
                    <FiCalendar />
                    {post.first_publication_date}
                  </li>
                  <li>
                    <FiUser />
                    {post.data.author}
                  </li>
                </ul>
              </a>
            </Link>
          ))}


          {
            nextPage && (<button
              type="button"
              onClick={handleNextPage}
            >
              Carregar mais posts
            </button>)
          }
        </div>
      </main>
    </>
  )
}

export const getStaticProps = async () => {
  const prismic = getPrismicClient({});
  const postsResponse = await prismic.getByType("posts", { pageSize: 1 });


  const posts = postsResponse.results.map(post => {
    return {
      uid: post.uid,
      first_publication_date: post.first_publication_date,
      data: {
        title: post.data.title,
        subtitle: post.data.subtitle,
        author: post.data.author,

      }
    }
  })

  const postsPagination = {
    next_page: postsResponse.next_page,
    results: posts
  }


  return {
    props: {
      postsPagination
    },
    revalidate: 60 * 60 * 24  //24 hours
  }
  // TODO
};
