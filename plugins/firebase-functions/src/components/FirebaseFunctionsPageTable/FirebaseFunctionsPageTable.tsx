/*
 * Copyright 2020 RoadieHQ
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
import React, { FC, useContext, useEffect, useState } from 'react';
import { Typography, Box, Button } from '@material-ui/core';
import GitHubIcon from '@material-ui/icons/GitHub';
import { Table, TableColumn } from '@backstage/core';
import { useEntityCompoundName } from '@backstage/plugin-catalog';
import { useLambda } from '../useLambda';
import { FunctionData } from '../../types';
import { Settings } from '../Settings';
import { AppContext, useSettings } from '../../state';
import moment from 'moment';

const getElapsedTime = (start: string) => {
  return moment(start).fromNow();
};

const generatedColumns: TableColumn[] = [
  {
    title: 'Name',
    field: 'name',
    width: '150px',
    render: (row: Partial<FunctionData>) => {
      const href = `https://console.cloud.google.com/functions/details/${row.region}/${row.name}?project=${row.project}`;
      return (
        <Box fontWeight="fontWeightBold">
          <a target="_blank" href={href}>
            {row.name}
          </a>
        </Box>
      );
    },
  },
  {
    title: 'Description',
    field: 'description',
    highlight: true,
    render: (row: Partial<FunctionData>) => (
      <Typography variant="body2" noWrap>
        {row.description}
      </Typography>
    ),
  },
  {
    title: 'Last modified',
    field: 'updateTime',
    width: '250px',
    render: (row: Partial<FunctionData>) => (
      <Typography variant="body2" noWrap>
        {getElapsedTime(row.updateTime!)}
      </Typography>
    ),
  },
  {
    title: 'Runtime',
    field: 'runtime',
    highlight: true,
    render: (row: Partial<FunctionData>) => (
      <Typography variant="body2" noWrap>
        {row.runtime}
      </Typography>
    ),
  },
  {
    title: 'Memory',
    field: 'availableMemoryMb',
    highlight: true,
    render: (row: Partial<FunctionData>) => (
      <Typography variant="body2" noWrap>
        {row.availableMemoryMb} MB
      </Typography>
    ),
  },
  {
    title: 'Logs',
    field: '',
    highlight: true,
    render: (row: Partial<FunctionData>) => {
      const href = `${row.name}`;

      return (
        <a href={href} target="_blank">
          <Button>click</Button>
        </a>
      );
    },
  },
];

type Props = {
  loading: boolean;
  retry: () => void;
  page: number;
  lambdaData?: FunctionData[];
  onChangePage: (page: number) => void;
  total: number;
  pageSize: number;
  onChangePageSize: (pageSize: number) => void;
};

const FirebaseFunctionsTableView: FC<Props> = ({
  loading,
  pageSize,
  page,
  lambdaData,
  onChangePage,
  onChangePageSize,
  total,
}) => {
  return (
    <Table
      isLoading={loading}
      options={{
        paging: true,
        pageSize,

        padding: 'dense',
        paginationType: 'normal',
      }}
      totalCount={total}
      page={page}
      data={lambdaData ?? []}
      onChangePage={onChangePage}
      onChangeRowsPerPage={onChangePageSize}
      title={
        <>
          <Box display="flex" alignItems="center">
            <GitHubIcon />
            <Box mr={1} />
            <Typography variant="h6">Test project</Typography>
          </Box>
        </>
      }
      columns={generatedColumns}
    />
  );
};

export const AWSLambdaPageTable = () => {
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(5);
  const [filteredRows, setFilteredRows] = useState<FunctionData[]>([]);
  let entityCompoundName = useEntityCompoundName();
  if (!entityCompoundName.name) {
    entityCompoundName = {
      kind: 'Component',
      name: 'backstage',
      namespace: 'default',
    };
  }
  const [settings, dispatch] = useContext(AppContext);

  const [tableProps] = useLambda({
    awsAccessKeyId: settings.awsAccessKeyId,
    awsAccessKeySecret: settings.awsAccessKeySecret,
    authMethod: settings.authMethod,
    identityPoolId: settings.identityPoolId,
    region: settings.region,
  });

  useSettings(entityCompoundName.name);
  useEffect(() => {
    tableProps.retry();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    settings.identityPoolId,
    settings.region,
    settings.authMethod,
    settings.awsAccessKeyId,
    settings.awsAccessKeySecret,
  ]);

  useEffect(() => {
    setFilteredRows(
      tableProps.lambdaData?.slice(page * pageSize, (page + 1) * pageSize) ??
        [],
    );
  }, [tableProps.lambdaData, page, pageSize]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <>
      <Button
        onClick={() =>
          dispatch({
            type: 'showSettings',
          })
        }
      >
        Settings
      </Button>
      {settings.showSettings && <Settings repoName={entityCompoundName.name} />}
      <FirebaseFunctionsTableView
        {...tableProps}
        lambdaData={filteredRows}
        page={page}
        total={tableProps.lambdaData?.length ?? 0}
        pageSize={pageSize}
        loading={tableProps.loading || tableProps.loading}
        retry={tableProps.retry}
        onChangePageSize={setPageSize}
        onChangePage={setPage}
      />
    </>
  );
};

export default FirebaseFunctionsTableView;
