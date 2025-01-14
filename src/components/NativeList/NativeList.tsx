import { Box, BoxProps } from '@material-ui/core'
import React, { memo, useCallback, useMemo, useState, useEffect } from 'react'
import { useRef } from 'react'
import { useParams } from 'react-router-dom'
import AutoSizer from 'react-virtualized-auto-sizer'
import { StickyTree } from 'react-virtualized-sticky-tree'
import { Namespace } from '../../store'
import NativeHeader from '../NativeHeader'
import JumpToNamespace from './JumpToNamespace'
import NativeListItem from './NativeListItem'

export interface NativeListProps extends Omit<BoxProps, 'children'> {
  namespaces: { [name: string]: Namespace }
}

function NativeList({ namespaces, sx = {}, ...rest }: NativeListProps) {
  const namespaceArray = useMemo(() => Object.values(namespaces), [namespaces])
  const namespaceData = useMemo(
    () => namespaceArray.reduce<{[name: string]: any}>((accumulator, namespace) => {
      accumulator[namespace.name] = namespace.natives.map(hash => ({
        node: {
          id: hash,
        },
        height: 28,
        isSticky: false,
      }))
      return accumulator
    }, {}), [namespaceArray])
  const { native: selectedNativeHash } = useParams<{ native: string } >()
  const [hasScrolledToNative, setHasScrolledToNative] = useState(false)
  const [listLoaded, setListLoaded] = useState(false)
  const listRef = useRef<StickyTree>(null)

  useEffect(() => {
    if (hasScrolledToNative || !listRef.current || !listLoaded) {
      return
    }
    setHasScrolledToNative(true)

    listRef.current.scrollNodeIntoView(selectedNativeHash)
  }, [listRef, selectedNativeHash, hasScrolledToNative, listLoaded, setHasScrolledToNative])

  const jumpToNamespace = useCallback((namespace: string) => {
    listRef.current?.scrollNodeIntoView(namespace)
  }, [listRef])

  const getChildren = useCallback(({ id }) => {
    if (!listLoaded) {
      setListLoaded(true)
    }

    if (id === 'root') {
      return namespaceArray.map(ns => ({
        node: {
          id: ns.name
        },
        height: 73,
        isSticky: true,
      }))
    }
    else if (id && (id[0] !== '0')) {
      return namespaceData[id]
    }
  }, [namespaceData, namespaceArray, listLoaded, setListLoaded])

  const renderRow = useCallback(({ node: { id }, style }) => {
    if (id && (id[0] !== '0')) {
      return (
        <NativeHeader 
          namespace={id}
          style={{...style, zIndex: 1 }} 
        />
      )
    }
    
    return (
      <NativeListItem
        nativeHash={id}
        style={style}
        key={id}
      />
    )
  }, [])

  return (
    <Box sx={{ flex: 1, ...sx }} {...rest}>
      <JumpToNamespace 
        onNamespaceClicked={jumpToNamespace}
      />
      <AutoSizer>
        {({ height, width }) => (
          <StickyTree
            root={{ node: { id: 'root' }, height: 0 }}
            ref={listRef}
            width={width}
            height={height}
            getChildren={getChildren}
            rowRenderer={renderRow}
            renderRoot={false}
            overscanRowCount={5}
          />
        )}
      </AutoSizer>
    </Box>
  )
}
export default memo(NativeList)
