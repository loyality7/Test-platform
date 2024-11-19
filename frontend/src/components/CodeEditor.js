import React from 'react';
import AceEditor from 'react-ace';

// Import ace modes and themes
import 'ace-builds/src-noconflict/mode-javascript';
import 'ace-builds/src-noconflict/mode-python';
import 'ace-builds/src-noconflict/mode-java';
import 'ace-builds/src-noconflict/theme-monokai';

export default function CodeEditor({ 
  value, 
  onChange, 
  language = 'javascript',
  readOnly = false 
}) {
  return (
    <AceEditor
      mode={language}
      theme="monokai"
      onChange={onChange}
      value={value}
      name="code-editor"
      editorProps={{ $blockScrolling: true }}
      setOptions={{
        enableBasicAutocompletion: true,
        enableLiveAutocompletion: true,
        enableSnippets: true,
        showLineNumbers: true,
        tabSize: 2,
      }}
      width="100%"
      height="400px"
      readOnly={readOnly}
    />
  );
} 