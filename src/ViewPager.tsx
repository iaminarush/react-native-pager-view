import React from 'react';
import { StyleSheet, View } from 'react-native';
import type { ViewPagerProps, ViewPagerState } from './types';

import { ViewPagerNative } from './ViewPagerNative';

type RenderWindowData = {
  buffer: number | undefined;
  currentPage: number;
  maxRenderWindow: number | undefined;
  offset: number;
  windowLength: number;
};

export class ViewPager<ItemT> extends React.PureComponent<
  ViewPagerProps<ItemT>,
  ViewPagerState
> {
  constructor(props: ViewPagerProps<ItemT>) {
    super(props);
    this.state = this.computeRenderWindow({
      buffer: props.buffer,
      currentPage: 0,
      maxRenderWindow: props.maxRenderWindow,
      offset: 0,
      windowLength: 0,
    });
  }

  /**
   * Compute desired render window size.
   *
   * Returns `offset` and `windowLength` unmodified, unless in conflict with
   * restrictions from `buffer` or `maxRenderWindow`.
   */
  computeRenderWindow(data: RenderWindowData): ViewPagerState {
    const buffer = Math.max(data.buffer ?? 1, 1);
    let offset = Math.max(Math.min(data.offset, data.currentPage - buffer), 0);
    let windowLength =
      Math.max(data.offset + data.windowLength, data.currentPage + buffer + 1) -
      offset;

    let maxRenderWindow = data.maxRenderWindow ?? 0;
    if (maxRenderWindow !== 0) {
      maxRenderWindow = Math.max(maxRenderWindow, 1 + 2 * buffer);
      if (windowLength > maxRenderWindow) {
        offset = data.currentPage - Math.floor(maxRenderWindow / 2);
        windowLength = maxRenderWindow;
      }
    }

    return { offset, windowLength };
  }

  renderChildren(offset: number, windowLength: number) {
    return this.props.data
      .slice(offset, offset + windowLength)
      .map((item, index) => (
        <View
          key={this.props.keyExtractor(item, offset + index)}
          style={styles.pageContainer}
        >
          {this.props.renderItem({ item, index: offset + index })}
        </View>
      ));
  }

  render() {
    const { offset, windowLength } = this.state;

    return (
      <ViewPagerNative
        count={this.props.data.length}
        offset={offset}
        onPageSelected={(event) => {
          const currentPage = event.nativeEvent.position;
          this.setState((prevState) =>
            this.computeRenderWindow({
              buffer: this.props.buffer,
              currentPage,
              maxRenderWindow: this.props.maxRenderWindow,
              offset: prevState.offset,
              windowLength: prevState.windowLength,
            })
          );
        }}
        style={this.props.style}
      >
        {this.renderChildren(offset, windowLength)}
      </ViewPagerNative>
    );
  }
}

const styles = StyleSheet.create({
  pageContainer: { height: '100%', position: 'absolute', width: '100%' },
});
