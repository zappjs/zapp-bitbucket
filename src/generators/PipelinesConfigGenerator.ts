import { IGenerator, generate } from '@zappjs/core';
import { YamlEngine } from '@zappjs/yaml';

import { IPipelinesConfigSpec } from '../interfaces';

export const PipelinesConfigGenerator: IGenerator<IPipelinesConfigSpec> = (spec) => {
  const buildStep = {
    step: {
      name: 'Build and test',
      script: Array.prototype.concat.apply([], [
        // make "dependencies" folder
        'mkdir /opt/atlassian/pipelines/agent/build/dependencies && cd /opt/atlassian/pipelines/agent/build/dependencies',
        // clone dependencies
        spec.dependencies.map(d => `git clone git@bitbucket.org:austincodeshop/${d}.git`),
        // install/build/link dependencies
        spec.dependencies.map(d => `cd /opt/atlassian/pipelines/agent/build/dependencies/${d} && npm install && npm run build && npm link`),
        // install/build/test self
        'cd /opt/atlassian/pipelines/agent/build && npm install && npm run postinstall && npm run build:dev && npm test'
      ])
    }
  };

  const deployStep = {
    step: {
      name: 'Deploy',
      script: Array.prototype.concat.apply([], [
        // delete current links
        `rm -rf /opt/atlassian/pipelines/agent/build/node_modules/${spec.scope}`,
        // re-link each dependency
        spec.dependencies.map(d => `cd /opt/atlassian/pipelines/agent/build/dependencies/${d} && npm link`)
      ])
    }
  }

  return generate({
    engine: YamlEngine,
    spec: {
      image: {
        name: 'austincodeshop/backend:0.1.5',
        'run-as-user': 1000
      },
      pipelines: {
        default: [buildStep],
        branches: {
          staging: [buildStep, deployStep],
          production: [buildStep, deployStep]
        }
      }
    }
  });  
}