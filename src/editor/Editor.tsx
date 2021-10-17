import cx from 'classnames';
import React, { useEffect, useState } from 'react';
import { sizeSidebar } from '@/vars';
import { Menu, ActivePane } from './Menu';
import { CodePane } from './code';

import { PassedSchema, Theming } from '@/Models';
import { DynamicResize } from './code/Components';
import { Graf } from '@/Graf/Graf';
import { Hierarchy } from '@/Hierarchy';
import { Parser, ParserTree, TreeToGraphQL } from 'graphql-js-tree';
import { Workers } from '@/worker';
import { style } from 'typestyle';
import { useTreesState } from '@/state/containers/trees';
import {
  useErrorsState,
  useNavigationState,
  useTheme,
} from '@/state/containers';
import { GraphQLEditorDomStructure } from '@/domStructure';
import { DiffEditor } from '@/DiffEditor';
import { Relation } from '@/Relation/Relation';
import { DarkTheme, EditorTheme } from '@/gshared/theme/DarkTheme';

export const Main = style({
  display: 'flex',
  flexFlow: 'row nowrap',
  height: '100%',
  width: '100%',
  alignItems: 'stretch',
});

export const FullScreenContainer = style({
  flex: 1,
  alignSelf: 'stretch',
  height: '100%',
});

export const Sidebar = style({
  alignSelf: 'stretch',
  zIndex: 2,
  display: 'flex',
  flex: 1,
  flexDirection: 'column',
  overflow: 'hidden',
  position: 'relative',
});

export const ErrorOuterContainer = style({
  width: '100%',
  position: 'relative',
  display: 'flex',
});

export interface EditorProps extends Theming {
  activePane?: ActivePane;
  readonly?: boolean;
  placeholder?: string;
  schema: PassedSchema;
  diffSchemas?: {
    oldSchema: PassedSchema;
    newSchema: PassedSchema;
  };
  onPaneChange?: (pane?: ActivePane) => void;
  setSchema: (props: PassedSchema, isInvalid?: boolean) => void;
  onTreeChange?: (tree: ParserTree) => void;
  theme?: EditorTheme;
}

let stopCodeFromTreeGeneration = false;
let stopTreeFromCodeGeneration = false;

export const Editor = ({
  readonly,
  placeholder,
  schema = {
    code: '',
    libraries: '',
  },
  initialSizeOfSidebar = sizeSidebar,
  activePane = 'relation',
  onPaneChange,
  setSchema,
  diffSchemas,
  onTreeChange,
  theme = DarkTheme,
}: EditorProps) => {
  const { theme: currentTheme, setTheme } = useTheme();
  const [sidebarSize, setSidebarSize] = useState<string | number>(
    initialSizeOfSidebar,
  );
  const { menuState, setMenuState, setToggleCode, toggleCode } =
    useNavigationState();
  const { grafErrors, setGrafErrors, setLockGraf, setCodeErrors, setLockCode } =
    useErrorsState();

  const {
    tree,
    setSnapshots,
    setUndos,
    setTree,
    setLibraryTree,
    setReadonly,
    isTreeInitial,
    setIsTreeInitial,
  } = useTreesState();

  const reset = () => {
    setSnapshots([]);
    setUndos([]);
    setGrafErrors(undefined);
  };

  const generateSchemaFromTree = () => {
    if (!tree) {
      return;
    }
    if (tree.nodes.length === 0) {
      if (schema.code !== '') {
        setSchema({
          ...schema,
          code: '',
        });
      }
      return;
    }
    try {
      const graphql = TreeToGraphQL.parse(tree);
      if (graphql !== schema.code || (grafErrors?.length || 0) > 0) {
        Workers.validate(graphql, schema.libraries).then((errors) => {
          if (errors.length > 0) {
            const mapErrors = errors.map((e) => e.text);
            const msg = [
              ...mapErrors.filter((e, i) => mapErrors.indexOf(e) === i),
            ].join('\n\n');
            setGrafErrors(msg);
            setLockCode(msg);
            return;
          }
          setLockCode(undefined);
          setGrafErrors(undefined);
          setSchema({ ...schema, code: graphql });
        });
      }
    } catch (error) {
      const msg = (error as any).message;
      setLockCode(msg);
      setGrafErrors(msg);
      return;
    }
  };

  const generateTreeFromSchema = () => {
    if (!schema.code) {
      setTree({ nodes: [] });
      return;
    }
    try {
      if (schema.libraries) {
        const excludeLibraryNodesFromDiagram = Parser.parse(schema.libraries);
        const parsedResult = Parser.parse(schema.code, [], schema.libraries);
        setTree({
          nodes: parsedResult.nodes.filter(
            (n) =>
              !excludeLibraryNodesFromDiagram.nodes.find(
                (eln) => eln.name === n.name && eln.data.type === n.data.type,
              ),
          ),
        });
      } else {
        const parsedCode = Parser.parse(schema.code);
        setTree(parsedCode);
      }
      Workers.validate(schema.code, schema.libraries).then((errors) => {
        console.log(errors);
        setCodeErrors(errors);
        setLockGraf(errors.map((e) => JSON.stringify(e, null, 4)).join('\n'));
      });
      setLockGraf(undefined);
    } catch (error) {
      Workers.validate(schema.code, schema.libraries).then((errors) => {
        setCodeErrors(errors);
        setLockGraf(errors.map((e) => JSON.stringify(e, null, 4)).join('\n'));
      });
    }
  };

  useEffect(() => {
    if (theme) {
      setTheme(theme);
    }
  }, [theme]);

  useEffect(() => {
    setReadonly(!!readonly);
  }, [readonly]);

  useEffect(() => {
    if (schema.libraries) {
      setLibraryTree(Parser.parse(schema.libraries));
    } else {
      setLibraryTree({ nodes: [] });
    }
    reset();
  }, [schema.libraries]);

  useEffect(() => {
    setMenuState(activePane);
  }, [activePane]);

  useEffect(() => {
    if (stopCodeFromTreeGeneration) {
      stopCodeFromTreeGeneration = false;
      return;
    }
    stopTreeFromCodeGeneration = true;
    generateTreeFromSchema();
  }, [schema.code]);
  useEffect(() => {
    onTreeChange?.(tree);
    if (isTreeInitial) {
      setIsTreeInitial(false);
      return;
    }
    if (stopTreeFromCodeGeneration) {
      stopTreeFromCodeGeneration = false;
      return;
    }
    stopCodeFromTreeGeneration = true;
    generateSchemaFromTree();
  }, [tree]);
  return (
    <div
      data-cy={GraphQLEditorDomStructure.tree.editor}
      className={Main}
      onKeyDown={(e) => {
        if (e.key.toLowerCase() === 'f' && (e.metaKey || e.ctrlKey)) {
          e.preventDefault();
        }
      }}
    >
      <Menu
        toggleCode={toggleCode}
        setToggleCode={(e) => setToggleCode(!menuState ? true : e)}
        activePane={menuState}
        excludePanes={diffSchemas ? undefined : ['diff']}
        setActivePane={(p) => {
          const pane = p === menuState ? (toggleCode ? undefined : p) : p;
          setMenuState(pane);
          if (onPaneChange) {
            onPaneChange(pane);
          }
        }}
      />
      {toggleCode && menuState !== 'diff' && (
        <DynamicResize
          disabledClass={!menuState ? FullScreenContainer : undefined}
          resizeCallback={(e, r, c, w) => {
            setSidebarSize(c.getBoundingClientRect().width);
          }}
          width={!menuState ? '100%' : sidebarSize}
        >
          <div
            className={cx(Sidebar, {
              [FullScreenContainer]: !menuState,
            })}
            data-cy={GraphQLEditorDomStructure.tree.sidebar.name}
            style={{
              background: currentTheme.background.mainFurthest,
            }}
          >
            {toggleCode && (
              <CodePane
                size={!menuState ? 100000 : sidebarSize}
                onChange={(v, isInvalid) => {
                  if (isInvalid) {
                    stopCodeFromTreeGeneration = true;
                    setLockGraf(isInvalid);
                  } else {
                    stopCodeFromTreeGeneration = false;
                  }
                  setSchema({ ...schema, code: v }, !!isInvalid);
                }}
                schema={schema.code}
                libraries={schema.libraries}
                placeholder={placeholder}
                readonly={readonly}
              />
            )}
          </div>
        </DynamicResize>
      )}
      {menuState === 'diagram' && (
        <div className={ErrorOuterContainer}>
          <Graf />
        </div>
      )}
      {menuState === 'relation' && (
        <div className={ErrorOuterContainer}>
          <Relation />
        </div>
      )}
      {menuState === 'hierarchy' && <Hierarchy />}
      {menuState === 'diff' && diffSchemas && (
        <DiffEditor
          schema={diffSchemas.oldSchema.code}
          newSchema={diffSchemas.newSchema.code}
        />
      )}
    </div>
  );
};
