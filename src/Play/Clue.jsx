import React from "react";

import './Clue.css'

const Clue = ({
  clue,
  handleClueClick,
  selected,
  secondary,
  linked,
  innerRef,
  filled
}) => {
    return <li
        style={{
            ...(selected ? { backgroundColor: '#85dcb0' } :
                linked ? { backgroundColor: '#e8a87c', opacity: '60%' } : {}),
            color: filled ? 'grey' : 'black',
            cursor: 'pointer',
            outline: 'none',
            display: 'flex',
            padding: '5px 10px 5px 1px'
        }}
        className={`${secondary ? 'secondaryClueBorder' : 'clueBorder'}`}
        key={clue.id}
        id={clue.id}
        selected={selected}
        onClick={() => handleClueClick(clue)}
        ref={innerRef}
        tabIndex='-1'>
        <span style={{ fontWeight: 'bold',
            textAlign: 'right',
            minWidth: '12px',
            width: '12px'
        }}>{clue.clueNumber}</span>
        <span style={{ marginLeft: '10px' }}>{clue.clue}</span>
    </li>
}

export default Clue;
