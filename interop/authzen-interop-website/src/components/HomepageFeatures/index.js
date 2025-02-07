import clsx from 'clsx';
import Heading from '@theme/Heading';
import Link from '@docusaurus/Link';
import styles from './styles.module.css';

const FeatureList = [
  {
    title: 'Architecture',
    image: '/img/architecture.png',
    link: '/docs/intro'
  },
];

function Feature({image, title, link}) {
  return (
    <div className={clsx('col col--12')}>
      <div className="text--center padding-horiz--md">
        <Heading as="h1">{title}</Heading>
      </div>
      <div className="text--center">
        <Link to={link}>
          <img src={image} alt={title} />
        </Link>
      </div>
    </div>
  );
}

function Video({title}) {
  return (
    <div className={clsx('col col--12')}>
      <div className="text--center padding-horiz--md">
        <Heading as="h1">{title}</Heading>
      </div>
      <div className={`text--center ${styles.lg}`}>
        <iframe width="800px" height="450px" src="https://www.youtube.com/embed/OtwEUeYDwBo?si=rDcpicU6m9QpAjD9" title="AuthZEN video" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" referrerpolicy="strict-origin-when-cross-origin" allowfullscreen></iframe>
      </div>
      <div className={`text--center ${styles.md}`}>
        <iframe width="560px" height="315px" src="https://www.youtube.com/embed/OtwEUeYDwBo?si=rDcpicU6m9QpAjD9" title="AuthZEN video" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" referrerpolicy="strict-origin-when-cross-origin" allowfullscreen></iframe>
      </div>
      <div className={`text--center ${styles.sm}`}>
        <iframe src="https://www.youtube.com/embed/OtwEUeYDwBo?si=rDcpicU6m9QpAjD9" title="AuthZEN video" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" referrerpolicy="strict-origin-when-cross-origin" allowfullscreen></iframe>
      </div>
    </div>
  );
}

export default function HomepageFeatures() {
  return (
    <>
      <section className={styles.features}>
        <div className="container">
          <div className="row">
            {FeatureList.map((props, idx) => (
              <Feature key={idx} {...props} />
            ))}
          </div>
        </div>
      </section>

      <section className={styles.features}>
        <div className="container">
          <div className="row">
            <Video title="Intro video" />
          </div>
        </div>
      </section>
    </>
  );
}
