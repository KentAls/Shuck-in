import { appAuth } from '@hellocoop/nextjs';
import config from '../../../../hello.config';

export const { GET } = appAuth(config);
