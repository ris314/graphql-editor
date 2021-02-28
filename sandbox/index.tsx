import React, { useState } from 'react';
import { render } from 'react-dom';
import { GraphQLEditor } from '../src/index';
import { PassedSchema } from '../src/Models';
import * as schemas from './schema';

export const App = () => {
  const [mySchema, setMySchema] = useState<PassedSchema>({
    code: schemas.food,
  });
  return (
    <div
      style={{
        flex: 1,
        width: '100%',
        height: '100%',
        alignSelf: 'stretch',
        display: 'flex',
        position: 'relative',
      }}
    >
      <GraphQLEditor
        setSchema={(props) => {
          setMySchema(props);
        }}
        diffSchemas={{
          newSchema: { code: schemas.versionedUsersLibraryLatest },
          oldSchema: { code: schemas.versionedUsersLibrary01 },
        }}
        schema={mySchema}
      />
    </div>
  );
};

render(<App />, document.getElementById('root'));
